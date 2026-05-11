import { useState, useCallback } from 'react';
import { calculateRouteRisk, calculateLocationRisk, getRiskLevel } from '../services/riskScoring';

/**
 * Custom hook for managing risk scoring state
 * Provides functions to calculate and manage risk scores
 */
export function useRiskScoring() {
  const [routeRiskScore, setRouteRiskScore] = useState(null);
  const [locationRiskScores, setLocationRiskScores] = useState({});
  const [crimeHotspots, setCrimeHotspots] = useState([]);

  // Calculate risk for a route
  const assessRouteRisk = useCallback((coordinates) => {
    const score = calculateRouteRisk(coordinates, crimeHotspots);
    setRouteRiskScore(score);
    return score;
  }, [crimeHotspots]);

  // Calculate risk for a location
  const assessLocationRisk = useCallback((lat, lon, key = `${lat}-${lon}`) => {
    const score = calculateLocationRisk(lat, lon, crimeHotspots);
    setLocationRiskScores(prev => ({
      ...prev,
      [key]: score
    }));
    return score;
  }, [crimeHotspots]);

  // Update crime hotspots
  const updateHotspots = useCallback((hotspots) => {
    setCrimeHotspots(hotspots);
  }, []);

  // Clear all scores
  const clearScores = useCallback(() => {
    setRouteRiskScore(null);
    setLocationRiskScores({});
  }, []);

  return {
    routeRiskScore,
    locationRiskScores,
    crimeHotspots,
    assessRouteRisk,
    assessLocationRisk,
    updateHotspots,
    clearScores
  };
}

export default useRiskScoring;
