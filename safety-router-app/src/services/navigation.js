
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

export async function makeRoute(payload) {
	const res = await fetch(`${BACKEND_API_URL}/api/navigation`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	})

	return res.json()
}