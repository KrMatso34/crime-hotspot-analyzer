const sessionStorage = {};

export function getCache(key, prefix="") {
	const cached = sessionStorage[`${prefix}:` + key];
	return cached ? JSON.parse(cached) : null;
}

export function setCache(key, prefix="", value="") {
	sessionStorage[`${prefix}:` + key] = JSON.stringify(value);
}