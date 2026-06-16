import { getCache, setCache } from '../util/cache.js';


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper to normalize incoming request body data to match algorithm expectations
 * @param {Array} crimes - Array of raw incident objects from req.body
 */
function normalizeCrimeData(crimes) {
  if (!Array.isArray(crimes)) return [];
  
  return crimes.map(item => ({
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    crimeType: item.crimeType || 'Unknown',
    date: item.timeOcurred ? new Date(item.timeOcurred) : new Date(),
    severity: item.severity || 'medium'
  }));
}

/**
 * Fetch all crime hotspots with aggregation
 * Expects req.body.crimes to contain the payload array
 */
export async function getHotspots(req, res) {
	const cached = getCache('hotspots');
	if (cached) {
		return res.json(cached);
	}

	try {
		const rawCrimes = req.body.crimes || [];
		const crimes = normalizeCrimeData(rawCrimes);
		
		// Aggregate crimes by location (rounded to 0.001 degree precision ~100m)
		const hotspotMap = new Map();
		
		crimes.forEach(crime => {
			const lat = Math.round(crime.lat * 1000) / 1000;
			const lon = Math.round(crime.lon * 1000) / 1000;
			const key = `${lat},${lon}`;
			
			if (!hotspotMap.has(key)) {
				hotspotMap.set(key, {
				lat,
				lon,
				crimes: [],
				severity: []
				});
			}
			
			const hotspot = hotspotMap.get(key);
			hotspot.crimes.push(crime.crimeType);
			hotspot.severity.push(crime.severity);
			});
			
			// Convert to array and calculate intensity
			const hotspots = Array.from(hotspotMap.values()).map(hotspot => {
			const intensity = Math.min(1, hotspot.crimes.length / 5);
			const maxSeverity = hotspot.severity.reduce((max, sev) => {
				const severityScore = { low: 0.3, medium: 0.6, high: 0.8, critical: 1.0 };
				return Math.max(max, severityScore[sev] || 0.5);
			}, 0);
			
			return {
				lat: hotspot.lat,
				lon: hotspot.lon,
				intensity: Math.max(intensity, maxSeverity),
				crimeCount: hotspot.crimes.length,
				crimeTypes: [...new Set(hotspot.crimes)],
				severity: Math.max(...hotspot.severity.map(s => ({ low: 0.3, medium: 0.6, high: 0.8, critical: 1.0 }[s] || 0.5)))
			};
		});
		
		setCache('crime_events', '', { hotspots });
		res.json({ hotspots });
	} catch (error) {
		console.error('Error processing hotspots:', error);
		res.status(500).json({ error: 'Failed to process crime hotspots' });
	}
}

/**
 * Fetch crimes within a specified area
 * Expects coordinates and the crimes array in req.body
 */
export async function getCrimesInArea(req, res) {

  try {
    // Note: Shifted from req.query to req.body to accommodate the incoming payload alongside parameters
    const { lat, lon, radiusKm = 2, crimes: rawCrimes } = req.body;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing latitude or longitude in request body' });
    }
    
    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);
    const radius = parseFloat(radiusKm);
    
    const allCrimes = normalizeCrimeData(rawCrimes);
    
    // Filter crimes within radius
    const crimes = allCrimes.filter(crime => {
      const distance = calculateDistance(centerLat, centerLon, crime.lat, crime.lon);
      return distance <= radius;
    });
    
    res.json({ crimes });
  } catch (error) {
    console.error('Error processing crimes in area:', error);
    res.status(500).json({ error: 'Failed to process area crimes' });
  }
}


/*
{
  "targetLat": 47.6101,
  "targetLon": -122.2015,
  "travelTime": "2026-06-20T23:00:00Z", 
  "crimes": [  your array of incident points  ]
}
*/
export async function getSafetyConfidence(req, res) {
  try {
    const { targetLat, targetLon, travelTime, crimes } = req.body;

	const crimeList = crimes.map((c) => ({
		lat: c[0],
		lon: c[1],
		severity: c[2],
		timeOcurred: c[4],
	}))
    
    const travelDate = new Date(travelTime);
    const targetDay = travelDate.getDay(); // 0 = Sunday, 6 = Saturday
    const targetHour = travelDate.getHours();

    // 1. Filter historical crimes near the target user's location (~500m radius)
    const nearbyCrimes = crimeList.filter(crime => {
      const dist = calculateDistance(targetLat, targetLon, crime.lat, crime.lon);
      return dist <= 0.5; 
    });

    if (nearbyCrimes.length === 0) {
      return res.json({ safetyConfidence: "100%", tier: "Very Safe", totalHistoricalIncidentsNearby: 0, message: "No historical crime data in this area." });
    }

    // 2. Calculate Temporal Match Modifiers
    let timeMatchCount = 0;
    let severityScore = 0;

    nearbyCrimes.forEach(crime => {
      const crimeDate = new Date(crime.timeOcurred);
      
      // Check if crime happened on the same type of day (Weekend vs Weekday)
      const isTargetWeekend = (targetDay === 0 || targetDay === 6);
      const isCrimeWeekend = (crimeDate.getDay() === 0 || crimeDate.getDay() === 6);
      const dayMatch = (isTargetWeekend === isCrimeWeekend);

      // Check if crime happened in the same general time window (e.g., +/- 3 hours)
      const hourDiff = Math.abs(crimeDate.getHours() - targetHour);
      const timeMatch = (hourDiff <= 3 || hourDiff >= 21); // Accounts for midnight wrap

      if (dayMatch && timeMatch) {
        timeMatchCount += 1.5; // Heavy weight for perfect time/day alignment
      } else if (timeMatch || dayMatch) {
        timeMatchCount += 0.8; // Moderate weight for partial alignment
      } else {
        timeMatchCount += 0.2; // Low weight for general presence
      }

      // Factor in severity
      const severityWeights = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.2 };
      severityScore += (severityWeights[crime.severity] || 0.5);
    });

    // 3. Normalize into a Risk Index (0 to 1)
    // Scale baseline: assuming 10 heavily-aligned or severe historical crimes maxes out the risk
    const baseRisk = (timeMatchCount * 0.4) + (severityScore * 0.6);
    const riskIndex = Math.min(1, baseRisk / 10); 

    // 4. Invert to get Safety Confidence
    const safetyConfidence = Math.round((1 - riskIndex) * 100);

    let tier = "Safe";
    if (safetyConfidence < 40) tier = "Critical Risk";
    else if (safetyConfidence < 70) tier = "Moderate Risk";

    res.json({
      safetyConfidence: `${safetyConfidence}%`,
      tier,
      totalHistoricalIncidentsNearby: nearbyCrimes.length,
      message: '',
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to calculate safety prediction." });
  }
}