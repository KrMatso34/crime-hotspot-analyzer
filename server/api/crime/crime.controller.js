/**
 * Crime Data Controller
 * Fetches and aggregates crime data from AWS S3
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

// Initialize S3 client
// Uses AWS_REGION and AWS credentials from environment variables
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });

// S3 bucket configuration
const CRIMES_BUCKET = process.env.AWS_S3_CRIMES_BUCKET || 'kags-crime-data-dev';
const CRIMES_PREFIX = process.env.AWS_S3_CRIMES_PREFIX || 'crime-data';

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
 * Fetch crime data from AWS S3
 * Reads crime data files from the S3 bucket
 * @returns {Promise<Array>} Array of crime records
 */
async function getCrimeDataFromS3() {
  try {
    // List objects in S3 bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: CRIMES_BUCKET,
      Prefix: CRIMES_PREFIX
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    let allCrimes = [];

    // Fetch and parse each JSON file
    for (const obj of objects) {
      if (!obj.Key.endsWith('.json')) continue; // Skip non-JSON files

      try {
        const getCommand = new GetObjectCommand({
          Bucket: CRIMES_BUCKET,
          Key: obj.Key
        });

        const response = await s3Client.send(getCommand);
        
        // Convert stream to string
        const stream = sdkStreamMixin(response.Body);
        let data = '';
        
        for await (const chunk of stream) {
          data += chunk;
        }

        const crimeData = JSON.parse(data);
        const crimes = Array.isArray(crimeData) ? crimeData : crimeData.crimes || [];

        // Transform S3 data to match our structure
        const transformedCrimes = crimes.map(item => ({
          id: item.id || `${item.latitude}-${item.longitude}-${item.timestamp}`,
          lat: parseFloat(item.latitude || item.lat),
          lon: parseFloat(item.longitude || item.lon),
          crimeType: item.crimeType || item.crime_type || 'Unknown',
          date: new Date(item.timestamp || item.date),
          severity: item.severity || 'medium',
          address: item.address,
          description: item.description
        }));

        allCrimes = allCrimes.concat(transformedCrimes);
      } catch (err) {
        console.warn(`Error parsing S3 object ${obj.Key}:`, err.message);
        continue;
      }
    }

    console.log(`Loaded ${allCrimes.length} crimes from S3 bucket ${CRIMES_BUCKET}`);
    return allCrimes;
  } catch (error) {
    console.error('Error fetching from S3:', error);
    // Fallback to mock data if S3 fails
    console.warn('Falling back to mock crime data');
    return getMockCrimeData();
  }
}

/**
 * Mock crime data for testing (fallback when DynamoDB is unavailable)
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
 * Reads crime data from S3 and aggregates them into hotspots
 */
export async function getHotspots(req, res) {
  try {
    const crimes = await getCrimeDataFromS3();
    
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
 * Reads crime data from S3 and filters by geo-radius
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
    
    // Fetch all crimes from S3
    const allCrimes = await getCrimeDataFromS3();
    
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
