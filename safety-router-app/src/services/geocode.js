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