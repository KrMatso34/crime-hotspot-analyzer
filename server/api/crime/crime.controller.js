/**
 * Crime Data Controller
 * Fetches and aggregates crime data from DynamoDB
 */

// TODO: Configure AWS SDK with your DynamoDB credentials
// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// const client = new DynamoDBClient({ region: 'us-west-2' });

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
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
 * Mock crime data for testing
 * Replace this with actual DynamoDB queries
 */
function getMockCrimeData() {
  const mockCrimes = [
    // Bellevue downtown area
    { lat: 47.6101, lon: -122.2015, crimeType: 'Theft', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), severity: 'medium' },
    { lat: 47.6102, lon: -122.2018, crimeType: 'Burglary', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), severity: 'high' },
    { lat: 47.6105, lon: -122.2010, crimeType: 'Assault', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), severity: 'critical' },
    
    // Highway 405 area
    { lat: 47.6200, lon: -122.1900, crimeType: 'Robbery', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), severity: 'high' },
    { lat: 47.6210, lon: -122.1905, crimeType: 'Theft', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), severity: 'medium' },
    
    // University District
    { lat: 47.6550, lon: -122.3000, crimeType: 'Theft', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), severity: 'medium' },
    { lat: 47.6560, lon: -122.3010, crimeType: 'Drug', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), severity: 'high' },
    
    // Fremont area
    { lat: 47.6519, lon: -122.3519, crimeType: 'Assault', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), severity: 'critical' },
    { lat: 47.6530, lon: -122.3510, crimeType: 'Theft', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), severity: 'medium' },
    
    // South Lake Union
    { lat: 47.6205, lon: -122.3330, crimeType: 'Theft', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), severity: 'medium' },
    { lat: 47.6210, lon: -122.3340, crimeType: 'Auto Theft', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), severity: 'high' },
  ];

  return mockCrimes;
}

/**
 * Fetch all crime hotspots with aggregation
 * In production, this would query DynamoDB for recent crimes and aggregate them
 */
export async function getHotspots(req, res) {
  try {
    const crimes = getMockCrimeData();
    
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
      // Calculate intensity based on count and recency
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
    
    res.json({ hotspots });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({ error: 'Failed to fetch crime hotspots' });
  }
}

/**
 * Fetch crimes within a specified area
 * In production, this would query DynamoDB for crimes within a geo-radius
 */
export async function getCrimesInArea(req, res) {
  try {
    const { lat, lon, radiusKm = 2 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }
    
    const centerLat = parseFloat(lat);
    const centerLon = parseFloat(lon);
    const radius = parseFloat(radiusKm);
    
    const allCrimes = getMockCrimeData();
    
    // Filter crimes within radius
    const crimes = allCrimes.filter(crime => {
      const distance = calculateDistance(centerLat, centerLon, crime.lat, crime.lon);
      return distance <= radius;
    });
    
    res.json({ crimes });
  } catch (error) {
    console.error('Error fetching crimes in area:', error);
    res.status(500).json({ error: 'Failed to fetch area crimes' });
  }
}
