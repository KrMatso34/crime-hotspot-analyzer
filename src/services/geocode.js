import axios from 'axios';

// Seattle/Bellevue area bounds for location verification
const VALID_AREA_BOUNDS = {
	north: 47.8,
	south: 47.4,
	east: -122.0,
	west: -122.5
};

/**
 * Verify if coordinates are within the valid service area
 */
export function isLocationValid(lat, lon) {
	return (
		lat >= VALID_AREA_BOUNDS.south &&
		lat <= VALID_AREA_BOUNDS.north &&
		lon >= VALID_AREA_BOUNDS.west &&
		lon <= VALID_AREA_BOUNDS.east
	);
}

/**
 * Geocode an address with optional location verification
 */
export async function geocodeAddress(query, verifyLocation = false) {
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
	
	if (!result) {
		throw new Error('Address not found');
	}

	// Verify location is in valid service area
	if (verifyLocation) {
		const lat = parseFloat(result.lat);
		const lon = parseFloat(result.lon);
		
		if (!isLocationValid(lat, lon)) {
			throw new Error('Location is outside the Seattle/Bellevue service area');
		}
	}

	return result;
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
	return formattedRoute;
}