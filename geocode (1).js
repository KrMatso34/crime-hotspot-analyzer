import axios from 'axios';

export async function geocodeAddress(query) {
	const res = await axios.get(
		'https://nominatim.openstreetmap.org/search',
		{
			params: {
				q: query,
				format: 'json',
				limit: 1
			},
			headers: {
				'Accept-Language': 'en',
			}
		}
	)
	return res.data[0];
}

// ─── RISK SCORING ENGINE ──────────────────────────────────────────────────────
// Scores a route based on proximity to crime incidents using Gaussian decay.
// Returns 0 (safe) → 100 (high risk).
//
// Fixed from original:
//   - routePoints.length < 0  →  < 2  (early exit never fired before)
//   - (a[0] + b[1]) / 2  →  (a[0] + b[0]) / 2  (was mixing lat + lon)
//   - Math.floor(score * 1000)  →  normalized + clamped to 0-100
//   - Added crime type weighting: violent 3×, property 1.5×, other 1×

const CRIME_TYPE_WEIGHT = {
	VIOLENT_CRIME:  3.0,
	PROPERTY_CRIME: 1.5,
	DEFAULT:        1.0,
};

function getCrimeWeight(incident) {
	const eventType = incident[3]; // 'VIOLENT_CRIME' | 'PROPERTY_CRIME' | etc
	return CRIME_TYPE_WEIGHT[eventType] ?? CRIME_TYPE_WEIGHT.DEFAULT;
}

function haversineDistance([lat1, lon1], [lat2, lon2]) {
	const R = 6371000;
	const toRad = deg => deg * Math.PI / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat/2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

function pointToSegmentDistance(p, a, b) {
	const toXY = (coord, refLat) => {
		const metersPerDegLat = 111320;
		const metersPerDegLng = 111320 * Math.cos(refLat * Math.PI / 180);
		return {
			x: coord[0] * metersPerDegLng,
			y: coord[1] * metersPerDegLat
		};
	};

	const refLat = (a[0] + b[0]) / 2; // fixed: was (a[0] + b[1]) / 2

	const P = toXY(p, refLat);
	const A = toXY(a, refLat);
	const B = toXY(b, refLat);

	const ABx = B.x - A.x;
	const ABy = B.y - A.y;
	const t = ((P.x - A.x) * ABx + (P.y - A.y) * ABy) / (ABx * ABx + ABy * ABy);
	const clampedT = Math.max(0, Math.min(1, t));
	const closest = { x: A.x + clampedT * ABx, y: A.y + clampedT * ABy };
	const dx = P.x - closest.x;
	const dy = P.y - closest.y;
	return Math.sqrt(dx * dx + dy * dy);
}

export function scoreRoute(routePoints, incidents) {
	const spread = 200; // radius of influence in meters

	// fixed: was `< 0` which never triggered
	if (!routePoints || routePoints.length < 2) return 0;
	if (!incidents   || incidents.length === 0)  return 0;

	let totalLength = 0;
	for (let i = 0; i < routePoints.length - 1; i++) {
		totalLength += haversineDistance(routePoints[i], routePoints[i + 1]);
	}
	if (totalLength === 0) return 0;

	let totalRisk = 0;

	for (const incident of incidents) {
		let minDistance = Infinity;
		for (let i = 0; i < routePoints.length - 1; i++) {
			const dist = pointToSegmentDistance(
				incident,
				routePoints[i],
				routePoints[i + 1]
			);
			minDistance = Math.min(minDistance, dist);
		}
		const decay       = Math.exp(-(minDistance ** 2) / (2 * spread ** 2));
		const crimeWeight = getCrimeWeight(incident);
		totalRisk += decay * crimeWeight;
	}

	// Normalize by route length, scale, clamp to 0-100
	// Tune SCALE_FACTOR if scores feel too bunched or too aggressive
	const SCALE_FACTOR = 15000;
	const scaled = (totalRisk / totalLength) * SCALE_FACTOR;
	return Math.min(100, Math.max(0, Math.round(scaled)));
}

// ─── ROUTE FETCHING ───────────────────────────────────────────────────────────

export async function fetchRoute(origin, destination, preference = 'safest') {
	const startRes = await geocodeAddress(origin);
	if (!startRes) throw new Error('Invalid origin address');

	const endRes = await geocodeAddress(destination);
	if (!endRes) throw new Error('Invalid destination address');

	const response = await axios.post('http://localhost:3001/api/navigation/route', {
		origin:      { lat: parseFloat(startRes.lat), lon: parseFloat(startRes.lon) },
		destination: { lat: parseFloat(endRes.lat),   lon: parseFloat(endRes.lon)   },
		preference,
	});

	return response.data;
}
