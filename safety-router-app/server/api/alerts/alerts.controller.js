import axios from 'axios'

export async function getAlerts(req, res) {
	try {
		const response = await axios.get(
			"https://data.seattle.gov/resource/tazs-3rd5.json?$limit=10&$order=report_date_time DESC"
		);

		const alerts = response.data.map(item => ({
			id: item.id || item.offense_id || item.report_number,
			title: item.offense_description || "Police Incident",
			description: `${item.block || ""} – ${item.neighborhood || ""}`,
			timestamp: item.report_date_time,
			type: item.offense_sub_category,
			tag: item.offense_category,
			lat: parseFloat(item.latitude),
			lng: parseFloat(item.longitude)
		}));

		res.json(alerts);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch SPD data" });
	}
}