
export async function makeRoute(payload) {
	const res = await fetch('http://localhost:4000/api/navigation', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	})

	return res.json()
}