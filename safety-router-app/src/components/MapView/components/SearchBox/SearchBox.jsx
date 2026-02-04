import { useState } from 'react'
import { geocodeAddress } from '../../../../services/geocode'

export default function SearchBox({ onSubmit, onResult }) {
	const [query, setQuery] = useState('Landerholm Circle');

	async function handleSearch() {
		onSubmit();
		const result = await geocodeAddress(query);
		if (result) {
			onResult(result);
		}
	}

	return (
		<div style={{
			top: 10,
			left: 10,
			background: 'white',
			padding: '8px'
		}}>
		<input
			value={query}
			onChange={e => setQuery(e.target.value)}
			placeholder="Enter address..."
		/>
		<button onClick={handleSearch}>Go</button>
		</div>
	)
}
