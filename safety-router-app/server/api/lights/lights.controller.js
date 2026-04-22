import { queryScanTable, scanTable } from '../util/dynamo.js';
import ngeohash from 'ngeohash';

import { getCache, setCache } from '../util/cache.js';

function getBounds(minLat, minLon, maxLat, maxLon) {
	return ngeohash.bboxes(minLat, minLon, maxLat, maxLon, 6);
}


export async function loadData(req, res) {
	const { minLat, minLon, maxLat, maxLon } = req.params;


	const key = `/api/lights/${ngeohash.encode(minLat, minLon, 6)}/${ngeohash.encode(maxLat, maxLon, 6)}`;
	const cached = getCache(key, 'lights');
	if (cached) {
		console.log(`Cached query: ${key}`)
		return res.json(cached);
	}

	const bounds = getBounds(minLat, minLon, maxLat, maxLon);

	
	const data = await queryScanTable('kags-streetlights-dev', 'geohash6', bounds);

	console.log(`Bounds (${minLat}, ${minLon}) - (${maxLat}, ${maxLon}) : ${data.length}`);

	setCache(key, 'lights', data);
	
	return res.json(data);

}