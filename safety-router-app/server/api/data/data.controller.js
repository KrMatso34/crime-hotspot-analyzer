import { scanTable } from '../util/dynamo.js';

function getSeverity(eventType) {
	if (eventType === 'VIOLENT_CRIME') {
		return 3;
	} else if (eventType === 'PROPERTY_CRIME') {
		return 2;
	} else {
		return 1;
	}
}

export async function loadData(req, res) {
	const data = await scanTable('CrimeEvents');
	//console.log(data[0]);
	res.json(
		data.map(entry => (
			[
				entry.location.lat, 
				entry.location.lon, 
				getSeverity(entry.event_type), 
				entry.event_type,
				entry.occurred_at
			]
		))
	);
}