

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

export async function getIncidentPoints(req, res, next) {
	res.json({
		data: [
			[47.6144, -122.1923, 2.00],
			[47.6186, -122.1950, 1.90],
			[47.6286, -122.1950, 2.00],
			[47.6140, -122.1961, 2.20],
			[47.6211, -122.2000, 2.50],
			[47.6120, -122.2030, 1.50],
			[47.6105, -122.1818, 2.00],
			[47.6258, -122.1920, 1.50],
			[47.6160, -122.2000, 1.80],
			[47.6263, -122.1888, 1.50]
		]
	});
}