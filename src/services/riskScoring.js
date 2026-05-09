/**
 * AI Risk Scoring Engine
 * Calculates safety risk scores for locations, routes, and areas
 */

/**
 * Risk Score Ranges
 */
export const RISK_LEVELS = {
  VERY_LOW: { min: 0, max: 0.2, label: 'Very Low', color: '#34C759', icon: '✓' },
  LOW: { min: 0.2, max: 0.4, label: 'Low', color: '#90EE90', icon: '○' },
  MEDIUM: { min: 0.4, max: 0.6, label: 'Medium', color: '#FFD700', icon: '⚠' },
  HIGH: { min: 0.6, max: 0.8, label: 'High', color: '#FF8C00', icon: '⚠⚠' },
  CRITICAL: { min: 0.8, max: 1.0, label: 'Critical', color: '#FF0000', icon: '🚨' }
};

/**
 * Get risk level object from score
 * @param {number} score - Risk score (0-1)
 * @returns {object} Risk level object with color and label
 */
export function getRiskLevel(score) {
  if (score < RISK_LEVELS.VERY_LOW.max) return RISK_LEVELS.VERY_LOW;
  if (score < RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
  if (score < RISK_LEVELS.MEDIUM.max) return RISK_LEVELS.MEDIUM;
  if (score < RISK_LEVELS.HIGH.max) return RISK_LEVELS.HIGH;
  return RISK_LEVELS.CRITICAL;
}

/**
 * Calculate risk score for a location based on proximity to crime hotspots
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {array} crimeHotspots - Array of crime hotspot data
 * @returns {number} Risk score (0-1)
 */
export function calculateLocationRisk(lat, lon, crimeHotspots = []) {
  if (!crimeHotspots || crimeHotspots.length === 0) {
    return Math.random() * 0.3; // Default low risk with slight variation
  }

  // Calculate weighted distance to hotspots
  let totalWeightedRisk = 0;
  let weightSum = 0;

  crimeHotspots.forEach(hotspot => {
    const distance = calculateDistance(lat, lon, hotspot.lat, hotspot.lon);
    
    // Risk decreases with distance (1000m radius)
    const distanceDecay = Math.exp(-distance / 500);
    const weight = hotspot.intensity || 0.5;
    
    totalWeightedRisk += distanceDecay * weight;
    weightSum += distanceDecay;
  });

  // Normalize to 0-1 range
  let riskScore = weightSum > 0 ? totalWeightedRisk / (weightSum * 2) : 0;
  
  // Clamp between 0 and 1
  return Math.min(1, Math.max(0, riskScore));
}

/**
 * Calculate risk score for a route
 * @param {array} routeCoordinates - Array of [lat, lon] coordinates
 * @param {array} crimeHotspots - Array of crime hotspot data
 * @returns {number} Average risk score for the route
 */
export function calculateRouteRisk(routeCoordinates = [], crimeHotspots = []) {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return 0;
  }

  // Sample route at intervals to avoid too many calculations
  const sampleInterval = Math.max(1, Math.floor(routeCoordinates.length / 20));
  let totalRisk = 0;
  let samples = 0;

  for (let i = 0; i < routeCoordinates.length; i += sampleInterval) {
    const [lat, lon] = routeCoordinates[i];
    const locationRisk = calculateLocationRisk(lat, lon, crimeHotspots);
    totalRisk += locationRisk;
    samples++;
  }

  return samples > 0 ? totalRisk / samples : 0;
}

/**
 * Haversine formula to calculate distance between two coordinates
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Generate recommendations based on risk assessment
 * @param {number} riskScore - Risk score (0-1)
 * @param {string} timeOfDay - 'morning', 'afternoon', 'evening', 'night'
 * @returns {array} Array of recommendations
 */
export function generateRecommendations(riskScore, timeOfDay = 'afternoon') {
  const recommendations = [];
  const riskLevel = getRiskLevel(riskScore);

  // Time-based recommendations
  const timeWarnings = {
    morning: [],
    afternoon: [],
    evening: ['Consider traveling before dusk'],
    night: ['Highly recommend waiting until morning or using rideshare']
  };

  // Risk-based recommendations
  if (riskScore < 0.3) {
    recommendations.push('✓ This is a safe route');
  } else if (riskScore < 0.5) {
    recommendations.push('⚠ Use standard safety precautions');
    recommendations.push('Stay aware of surroundings');
  } else if (riskScore < 0.7) {
    recommendations.push('⚠ High caution recommended');
    recommendations.push('Travel with companions if possible');
    recommendations.push('Share your location with someone');
  } else {
    recommendations.push('🚨 Very high risk - Consider alternative route');
    recommendations.push('Travel only during daylight hours');
    recommendations.push('Use rideshare or public transportation');
  }

  // Add time-specific warnings
  if (timeWarnings[timeOfDay]) {
    recommendations.push(...timeWarnings[timeOfDay]);
  }

  return recommendations;
}

/**
 * Get real-time risk factors (simulated)
 * In production, this would connect to real-time crime data APIs
 */
export function getRealTimeFactors() {
  return {
    currentIncidents: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
    recentCrimes: Math.floor(Math.random() * 10),
    policePresence: Math.random() > 0.5 ? 'High' : 'Standard',
    weatherCondition: 'Clear',
    dayOfWeek: new Date().toLocaleString('en-us', { weekday: 'long' }),
    timeOfDay: getTimeOfDay(new Date().getHours())
  };
}

/**
 * Classify time of day
 */
export function getTimeOfDay(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate composite risk score from multiple factors
 * @param {object} factors - Risk factors
 * @returns {number} Composite risk score (0-1)
 */
export function calculateCompositeRisk(factors = {}) {
  const {
    locationRisk = 0.5,
    timeOfDayRisk = 0.5,
    dayOfWeekRisk = 0.5,
    weatherRisk = 0.5,
    policePresenceModifier = 1.0
  } = factors;

  // Weighted average with police presence as a mitigating factor
  const composite = (
    locationRisk * 0.5 +
    timeOfDayRisk * 0.2 +
    dayOfWeekRisk * 0.15 +
    weatherRisk * 0.15
  ) * policePresenceModifier;

  return Math.min(1, Math.max(0, composite));
}

export default {
  calculateLocationRisk,
  calculateRouteRisk,
  calculateDistance,
  getRiskLevel,
  generateRecommendations,
  getRealTimeFactors,
  calculateCompositeRisk,
  RISK_LEVELS
};
