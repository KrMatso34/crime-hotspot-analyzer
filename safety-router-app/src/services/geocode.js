import axios from 'axios';

function getCache(key) {
	const cached = sessionStorage.getItem("geocode:" + key);
	return cached ? JSON.parse(cached) : null;
}

function setCache(key, value) {
	if (value == undefined) return;
	sessionStorage.setItem("geocode:" + key, JSON.stringify(value));
}

export async function geocodeAddress(query) {
	const key = query.toLowerCase().trim();

	const cached = getCache(key);
	if (cached) return cached;
	
	try {
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


		const result = res.data[0];
		setCache(key, result);

		return result;
	} catch (err) {
		throw err;
	}
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

	const refLat = (a[0] + b[0]) / 2;

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


// Crime type weights — matches severity levels already in data.controller.js
const CRIME_TYPE_WEIGHT = {
	VIOLENT_CRIME:  3.0,
	PROPERTY_CRIME: 1.5,
	DEFAULT:        1.0,
};

function getCrimeWeight(incident) {
	return 1;
	const eventType = incident[3]; // 'VIOLENT_CRIME' | 'PROPERTY_CRIME' | etc
	return CRIME_TYPE_WEIGHT[eventType] ?? CRIME_TYPE_WEIGHT.DEFAULT;
}

/**
 * scoreRoute
 * @param {Array} routePoints  [[lat, lon], [lat, lon], ...]
 * @param {Array} incidents    [[lat, lon, severity, eventType, timestamp], ...]
 * @returns {number}           0 (safe) → 100 (high risk)
 */
export function scoreRoute(routePoints, incidents) {
	const spread = 200; // radius of influence in meters
						// 120 → ~1 block · 200 → neighborhood · 400 → broader

	// fixed: was `< 0` which never triggered
	if (!routePoints || routePoints.length < 2) return 0;
	if (!incidents   || incidents.length === 0)  return 0;


	let totalLength = 0;
	for (let i = 0; i < routePoints.length - 1; i++) {
		totalLength += haversineDistance(routePoints[i], routePoints[i+1]);
	}
	if (totalLength === 0) return 0;


	let totalRisk = 0;

	for (const incident of incidents) {
		let minDistance = Infinity;

		for (let i = 0; i < routePoints.length - 1; i++) {
			const dist = pointToSegmentDistance(
				[incident[0], incident[1]],
				routePoints[i],
				routePoints[i+1]
			);
			minDistance = Math.min(minDistance, dist);
		}

		// Gaussian decay × crime type weight
		const decay       = Math.exp(-(minDistance ** 2) / (2 * spread ** 2));
		const crimeWeight = getCrimeWeight(incident);
		totalRisk += decay * crimeWeight;
	}

	// Normalize by route length, scale to 0–100, clamp
	// adjust SCALE_FACTOR if scores feel too bunched or too aggressive
	const SCALE_FACTOR = 15000;
	const scaled = (totalRisk / totalLength) * SCALE_FACTOR;
	return Math.min(100, Math.max(0, Math.round(scaled)));
}

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

function prepareHeatMap(heatMapPoints, fromLat, fromLon, toLat, toLon) {
	const latSize = Math.abs(fromLat - toLat);
	const lonSize = Math.abs(fromLon - toLon);
	const minLat = Math.min(fromLat, toLat) - latSize;
	const maxLat = Math.max(fromLat, toLat) + latSize;
	const minLon = Math.min(fromLon, toLon) - lonSize;
	const maxLon = Math.max(fromLon, toLon) + lonSize;

	const filteredHeatMap = [];
	for (const hp of heatMapPoints) {
		if (hp[0] < minLat || hp[0] > maxLat || hp[1] < minLon || hp[1] > maxLon) continue;

		// Only include lon, lat, and severity parts of heatmap point
		// No need to send incident type
		filteredHeatMap.push([hp[0], hp[1], hp[2]]); 
	}
	return filteredHeatMap;
}

export async function fetchRoute(origin, destination, routePriority='safest', heatMapPoints=[], riskZones=[], streetlightData, vehicle='car') {
	try {
		const startRes = await geocodeAddress(origin);

		if (!startRes) throw new Error('Invalid origin address');

		const endRes = await geocodeAddress(destination);

		if (!endRes) throw new Error('Invalid destination address');

		const params = { 
			fromLat: startRes.lat, 
			fromLon: startRes.lon, 
			toLat: endRes.lat, 
			toLon: endRes.lon, 
			routePriority,
			heatmapData: prepareHeatMap(heatMapPoints, startRes.lat, startRes.lon, endRes.lat, endRes.lon),
			vehicle,
			riskZones: riskZones.filter(zone => zone.active).map(zone => zone.geometry.coordinates[0].map(coord => ([coord[1], coord[0]]))),
			streetlightData: streetlightData,
		}

		let route;

		await axios.post('http://localhost:8080/route', params)
			.then(res => {
				route = res.data;
			})
			.catch(err => {
				throw Error('Error fetching route', err)
			})
		
		return route;
	} catch (err) {
		throw err;
	}
}