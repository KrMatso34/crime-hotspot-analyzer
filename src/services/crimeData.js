import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

/**
 * Fetch crime hotspots from the backend
 * @returns {Promise<Array>} Array of crime hotspot objects with {lat, lon, intensity, crimeType, date}
 */
export async function fetchCrimeHotspots() {
  try {
    const response = await axios.get(`${API_BASE}/crime/hotspots`);
    return response.data.hotspots || [];
  } catch (error) {
    console.error('Error fetching crime hotspots:', error);
    return [];
  }
}

/**
 * Fetch crime incidents in a specific area
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radiusKm - Search radius in kilometers (default 2km)
 * @returns {Promise<Array>} Array of crime incidents
 */
export async function fetchCrimesInArea(lat, lon, radiusKm = 2) {
  try {
    const response = await axios.get(`${API_BASE}/crime/area`, {
      params: {
        lat,
        lon,
        radiusKm
      }
    });
    return response.data.crimes || [];
  } catch (error) {
    console.error('Error fetching crimes in area:', error);
    return [];
  }
}

/**
 * Convert crime incidents to hotspots with intensity
 * @param {Array} crimes - Array of crime incidents
 * @returns {Array} Array of hotspot objects
 */
export function convertCrimesToHotspots(crimes) {
  if (!crimes || crimes.length === 0) {
    return [];
  }

  // Group crimes by location (rounded to 0.001 degree precision ~100m)
  const hotspotMap = new Map();

  crimes.forEach(crime => {
    const lat = Math.round(crime.lat * 1000) / 1000;
    const lon = Math.round(crime.lon * 1000) / 1000;
    const key = `${lat},${lon}`;

    if (!hotspotMap.has(key)) {
      hotspotMap.set(key, {
        lat,
        lon,
        count: 0,
        crimes: [],
        intensity: 0
      });
    }

    const hotspot = hotspotMap.get(key);
    hotspot.count += 1;
    hotspot.crimes.push(crime.crimeType);
  });

  // Convert map to array and calculate intensity
  const hotspots = Array.from(hotspotMap.values()).map(hotspot => ({
    lat: hotspot.lat,
    lon: hotspot.lon,
    // Intensity: normalize by crime count (0-1 scale, capped at 10 crimes)
    intensity: Math.min(1, hotspot.count / 10),
    crimeCount: hotspot.count,
    crimeTypes: [...new Set(hotspot.crimes)]
  }));

  return hotspots;
}

/**
 * Fetch and convert crimes to hotspots for risk scoring
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<Array>} Array of hotspot objects for risk scoring
 */
export async function fetchHotspotsForArea(lat, lon, radiusKm = 5) {
  try {
    const crimes = await fetchCrimesInArea(lat, lon, radiusKm);
    return convertCrimesToHotspots(crimes);
  } catch (error) {
    console.error('Error fetching hotspots for area:', error);
    return [];
  }
}

export default {
  fetchCrimeHotspots,
  fetchCrimesInArea,
  convertCrimesToHotspots,
  fetchHotspotsForArea
};
