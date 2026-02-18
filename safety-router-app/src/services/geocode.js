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