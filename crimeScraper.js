/**
 * KAGS — Real-Time X (Twitter) Crime Scraper
 * ============================================
 * Watches X for crime keywords in the Bellevue/Seattle area and
 * pushes incidents to the existing DynamoDB CrimeEvents table
 * as fast as the API allows.
 *
 * Plugs directly into your existing stack:
 *   - Same DynamoDB table: CrimeEvents
 *   - Same schema: { location: {lat, lon}, event_type, occurred_at, source }
 *   - data.controller.js picks them up automatically on next fetch
 *
 * Setup:
 *   1. Create a free X Developer account at developer.twitter.com
 *   2. Create a project + app, grab the Bearer Token
 *   3. Add to .env: X_BEARER_TOKEN=your_token_here
 *   4. npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb dotenv node-fetch uuid
 *   5. node scripts/crimeScraper.js
 *
 * X Free tier gives you ~500k tweet reads/month — more than enough for this.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

// ─── CONFIG ──────────────────────────────────────────────────

const DYNAMODB_TABLE = process.env.KAGS_DYNAMODB_TABLE || 'CrimeEvents';
const BEARER_TOKEN   = process.env.X_BEARER_TOKEN;

if (!BEARER_TOKEN) {
	console.error('Missing X_BEARER_TOKEN in .env');
	process.exit(1);
}

// Bellevue/Seattle bounding box for geo-filtered stream
// X filtered stream supports bounding_box: [west, south, east, north]
const BELLEVUE_BBOX = '-122.22,47.54,-122.10,47.65';
const SEATTLE_BBOX  = '-122.46,47.49,-122.24,47.73';

// Keywords that suggest a real crime incident.
// Kept tight to avoid noise — expand carefully.
const CRIME_KEYWORDS = [
	'shooting', 'stabbing', 'robbery', 'carjacking',
	'assault', 'homicide', 'break-in', 'burglary',
	'hit and run', 'car theft', 'stolen vehicle',
	'police response', 'crime scene', 'suspect fled',
];

// Classify tweet into our existing event_type enum
// Matches what data.controller.js expects: VIOLENT_CRIME / PROPERTY_CRIME / OTHER
function classifyTweet(text) {
	const t = text.toLowerCase();

	const violent = ['shooting', 'stabbing', 'assault', 'homicide', 'robbery', 'carjacking'];
	const property = ['burglary', 'break-in', 'car theft', 'stolen vehicle', 'hit and run'];

	if (violent.some(k => t.includes(k)))  return 'VIOLENT_CRIME';
	if (property.some(k => t.includes(k))) return 'PROPERTY_CRIME';
	return 'OTHER';
}

// ─── LOCATION EXTRACTION ─────────────────────────────────────
// X geo is often missing on tweets. We use three fallbacks in order:
//   1. Tweet geo.coordinates (exact, rare)
//   2. Place bounding box centroid (common)
//   3. Keyword-based location guess for known Bellevue areas

const KNOWN_LOCATIONS = {
	'downtown bellevue': { lat: 47.6135, lon: -122.1975 },
	'crossroads':        { lat: 47.6155, lon: -122.1460 },
	'factoria':          { lat: 47.5675, lon: -122.1595 },
	'bellevue':          { lat: 47.6101, lon: -122.2015 },
	'seattle':           { lat: 47.6062, lon: -122.3321 },
	'belltown':          { lat: 47.6137, lon: -122.3439 },
	'pioneer square':    { lat: 47.5998, lon: -122.3333 },
	'rainier valley':    { lat: 47.5525, lon: -122.2890 },
};

function extractLocation(tweet) {
	// 1. Exact coordinates attached to tweet
	if (tweet.geo?.coordinates) {
		const [lon, lat] = tweet.geo.coordinates.coordinates;
		return { lat, lon };
	}

	// 2. Place bounding box — use centroid
	if (tweet.geo?.place_id && tweet._place) {
		const bbox = tweet._place.geo.bbox; // [west, south, east, north]
		return {
			lat: (bbox[1] + bbox[3]) / 2,
			lon: (bbox[0] + bbox[2]) / 2,
		};
	}

	// 3. Keyword guess from tweet text
	const text = tweet.text.toLowerCase();
	for (const [place, coords] of Object.entries(KNOWN_LOCATIONS)) {
		if (text.includes(place)) return coords;
	}

	// 4. Default to Bellevue center — better than dropping the tweet entirely
	return { lat: 47.6101, lon: -122.2015 };
}

// ─── DYNAMODB ────────────────────────────────────────────────

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function pushToDynamo(tweet, location, eventType) {
	const item = {
		// Primary key — uuid so duplicate tweets don't clobber each other
		id:         uuidv4(),
		tweet_id:   tweet.id,
		source:     'x_scraper',

		// Matches the schema data.controller.js reads
		location: {
			lat: location.lat,
			lon: location.lon,
		},
		event_type:  eventType,
		occurred_at: tweet.created_at ?? new Date().toISOString(),

		// Extra context
		tweet_text: tweet.text,
		author_id:  tweet.author_id,
	};

	await dbClient.send(new PutCommand({
		TableName: DYNAMODB_TABLE,
		Item: item,
		// Don't overwrite if we've already processed this tweet
		ConditionExpression: 'attribute_not_exists(tweet_id)',
	}));

	console.log(`[${new Date().toISOString()}] Saved: ${eventType} @ ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`);
	console.log(`  "${tweet.text.slice(0, 80)}..."`);
}

// ─── X FILTERED STREAM ───────────────────────────────────────
// Uses X v2 filtered stream — real-time, persistent connection.
// Reconnects automatically on drop.

async function setStreamRules() {
	const existing = await fetch('https://api.twitter.com/2/tweets/search/stream/rules', {
		headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
	}).then(r => r.json());

	// Delete old rules first
	if (existing.data?.length) {
		const ids = existing.data.map(r => r.id);
		await fetch('https://api.twitter.com/2/tweets/search/stream/rules', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ delete: { ids } })
		});
	}

	// Set fresh rules — geo filter + crime keywords
	const keywordQuery = CRIME_KEYWORDS.map(k => `"${k}"`).join(' OR ');
	const rules = [
		{
			// Bellevue geo + crime keywords
			value: `(${keywordQuery}) bounding_box:[${BELLEVUE_BBOX}] lang:en -is:retweet`,
			tag: 'bellevue_crime',
		},
		{
			// Seattle geo + crime keywords
			value: `(${keywordQuery}) bounding_box:[${SEATTLE_BBOX}] lang:en -is:retweet`,
			tag: 'seattle_crime',
		},
		{
			// Fallback: no geo filter, but must mention Bellevue/Seattle explicitly
			// catches tweets without location attached
			value: `(${keywordQuery}) (bellevue OR seattle OR "king county") lang:en -is:retweet`,
			tag: 'keyword_fallback',
		}
	];

	const res = await fetch('https://api.twitter.com/2/tweets/search/stream/rules', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${BEARER_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ add: rules })
	}).then(r => r.json());

	console.log('Stream rules set:', res.data?.length, 'rules active');
}

async function startStream() {
	const url = 'https://api.twitter.com/2/tweets/search/stream'
		+ '?tweet.fields=created_at,geo,author_id,text'
		+ '&place.fields=geo,name,place_type'
		+ '&expansions=geo.place_id';

	console.log('Connecting to X filtered stream...');

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
	});

	if (!response.ok) {
		throw new Error(`Stream connection failed: ${response.status} ${response.statusText}`);
	}

	console.log('Connected. Watching for crime incidents...\n');

	// Read the stream line by line
	const decoder = new TextDecoder();
	let buffer = '';

	for await (const chunk of response.body) {
		buffer += decoder.decode(chunk, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop(); // keep incomplete last line

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue; // heartbeat keepalive

			try {
				const payload = JSON.parse(trimmed);
				const tweet = payload.data;
				if (!tweet) continue;

				// Attach place data if available
				if (payload.includes?.places?.length) {
					tweet._place = payload.includes.places[0];
				}

				const location  = extractLocation(tweet);
				const eventType = classifyTweet(tweet.text);

				await pushToDynamo(tweet, location, eventType);

			} catch (err) {
				// Skip malformed lines — stream occasionally sends partial JSON
				if (!(err instanceof SyntaxError)) {
					console.error('Error processing tweet:', err.message);
				}
			}
		}
	}
}

// ─── MAIN — reconnects on drop ────────────────────────────────

async function main() {
	console.log('KAGS Crime Scraper starting...');
	console.log(`Table: ${DYNAMODB_TABLE}`);
	console.log(`Keywords: ${CRIME_KEYWORDS.join(', ')}\n`);

	await setStreamRules();

	// Reconnect loop — X streams drop occasionally
	while (true) {
		try {
			await startStream();
		} catch (err) {
			console.error('Stream error:', err.message);
			console.log('Reconnecting in 10 seconds...');
			await new Promise(r => setTimeout(r, 10000));
		}
	}
}

main();
