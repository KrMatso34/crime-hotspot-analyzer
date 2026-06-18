
import { spawn } from 'child_process';
import path from 'path';

export async function getRoute(req, res, next) {
	const { origin, destination, preference = 'safest', context } = req.body;

	// Basic validation
	if (!origin?.lat || !origin?.lon || !destination?.lat || !destination?.lon) {
		return res.status(400).json({ error: 'Missing origin or destination coordinates' });
	}

	// Path to your Python script (adjust if needed)
	// Assuming get_route.py is in the project root (safety-router-app)
	const pythonScript = path.join(process.cwd(), 'get_route.py');

	const pyProcess = spawn('python3', [
		pythonScript,
		origin.lat.toString(),
		origin.lon.toString(),
		destination.lat.toString(),
		destination.lon.toString(),
		preference
	]);

	let output = '';
	let errorOutput = '';

	pyProcess.stdout.on('data', (data) => {
		output += data.toString();
	});

	pyProcess.stderr.on('data', (data) => {
		errorOutput += data.toString();
	});

	pyProcess.on('close', (code) => {
		if (code !== 0) {
			console.error('Python route error:', errorOutput.trim());

			return res.status(500).json({ 
				error: 'Route calculation failed',
				details: errorOutput.trim() || 'Unknown Python error'
			});
		}

		try {
			const result = JSON.parse(output.trim());

			if (result.error) {
				return res.status(400).json({ error: result.error });
			}

			// Return format your frontend expects
			res.json({
				geometry: result.geometry,
				distance: result.distance_mi,
				duration: result.duration_min,
				riskAssessment: result.riskAssessment
			});
		} catch (e) {
			console.error('JSON parse error:', e, 'Raw output:', output);
			res.status(500).json({ error: 'Invalid route format from Python' });
		}
	});

	pyProcess.on('error', (err) => {
		console.error('Spawn failed:', err);
		res.status(500).json({ error: 'Could not start route calculator' });
	});
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
