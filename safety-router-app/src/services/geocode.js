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

// Calculate distance taking earth's round shape into account 
function haversineDistance([lat1, lon1], [lat2, lon2]) {
	const R = 6371000; // meters
	const toRad = deg => deg * Math.PI / 180;

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a =
		Math.sin(dLat/2) ** 2 +
		Math.cos(toRad(lat1)) *
		Math.cos(toRad(lat2)) *
		Math.sin(dLon/2) ** 2;

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

	const refLat = (a[0] + b[1]) / 2;

	const P = toXY(p, refLat);
	const A = toXY(a, refLat);
	const B = toXY(b, refLat);


	const ABx = B.x - A.x;
	const ABy = B.y - A.y;

	const t = ((P.x - A.x) * ABx + (P.y - A.y) * ABy) /
				(ABx * ABx + ABy * ABy);

	const clampedT = Math.max(0, Math.min(1, t));

	const closest = {
		x: A.x + clampedT * ABx,
		y: A.y + clampedT * ABy
	};

	const dx = P.x - closest.x;
	const dy = P.y - closest.y;

	return Math.sqrt(dx * dx + dy * dy);
}


export function scoreRoute(routePoints, incidents) {
	const 
		spread = 200,	// Radius of influence in meters
						//   * 120 -> about 1 block
						//   * 200 -> neighborhood level
						//   * 400 -> broader avoidance
		severity = 50.0	// Global multiplier
	;

	if (routePoints.length < 0) return 0;

	let totalLength = 0;
	for (let i = 0; i < routePoints.length - 1; i++) {
		totalLength += haversineDistance(routePoints[i], routePoints[i + 1]);
	}


	let totalRisk = 0;

	for (const incident of incidents) {
		let minDistance = Infinity;

		// Find route closest segment
		for (let i = 0; i < routePoints.length - 1; i++) {
			const dist = pointToSegmentDistance(
				incident,
				routePoints[i],
				routePoints[i + 1]
			);
			minDistance = Math.min(minDistance, dist);
		}

		// Gaussian decay
		const riskContribution = severity * Math.exp(-(minDistance ** 2) / (2 * spread ** 2));

		totalRisk += riskContribution;
	}

	// Normalize by route length 
	let score = totalRisk / totalLength;

	// Truncate value
	score = Math.floor(score * 1000);

	return score;
}

export async function fetchRoute(origin, destination) {
	const startRes = await geocodeAddress(origin);

	if (!startRes) throw new Error('Invalid origin address');

	const endRes = await geocodeAddress(destination);

	if (!endRes) throw new Error('Invalid destination address');


	const start = [
		parseFloat(startRes.lat),
		parseFloat(startRes.lon),
	];

	const end = [
		parseFloat(endRes.lat),
		parseFloat(endRes.lon),
	];


	/*
	const routeRes = await axios.get(
		`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}`,
		{
			params: {
				overview: "full",
				geometries: "geojson",
			},
		}
	);

	const route = routeRes.data.routes[0].geometry.coordinates;

	// Convert [lng, lat] -> [lat, lng]
	const formattedRoute = route.map(coord => [coord[1], coord[0]]);
	*/
	let route;

	await axios.get('http://localhost:8080/route', {
		params: { fromLat: start[0], fromLon: start[1], toLat: end[0], toLon: end[1] }
	}).then(res => {
		route = res.data;
		
	}).catch(err => {
		console.error('Error fetching route: ', err);
	})
	
	return route;
}