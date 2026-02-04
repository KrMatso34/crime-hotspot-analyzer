

export async function getRoute(req, res, next) {
	const { origin, destination, preference, context } = req.body;

	// TODO: Build route

	// TEMP: hardcoded data
	const route = {
		geometry: [
			destination.lat,
			destination.lon
		],
		distance: 1420,
		duration: 980,
		riskAssessment: 0.83,
	}

	res.json(route)
}
