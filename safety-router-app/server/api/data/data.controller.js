import { scanTable } from '../util/dynamo.js';
import { getCache, setCache } from '../util/cache.js';

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
	const cached = getCache('crime_events');
	if (cached) {
		return res.json(cached);
	}


	const dataRaw = await scanTable('CrimeEvents');
	const data = dataRaw.map(entry => (
		[
			entry.location.lat, 
			entry.location.lon, 
			getSeverity(entry.event_type), 
			entry.event_type,
			entry.occurred_at
		]
	));

	setCache('crime_events', '', data);
	
	res.json(
		data
	);
}