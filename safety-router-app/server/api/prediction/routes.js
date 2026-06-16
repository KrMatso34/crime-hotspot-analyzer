import * as funcs from './prediction.controller.js';
import express from 'express';

const router = express.Router();

/**
 * Get all crime hotspots
 * @route   POST /hotspots
 * @access  Public
 * @body    {Object} { crimes: Array<{lat, lon, timeOcurred, severity, crimeType}> }
 * @returns {Object} { hotspots: Array<{lat, lon, intensity, crimeCount, crimeTypes, severity}> }
 */
router.post('/hotspots', funcs.getHotspots);

/**
 * Get crimes in a specific area
 * @route   POST /area
 * @access  Public
 * @body    {Object} { lat, lon, radiusKm, crimes: Array<{lat, lon, timeOcurred, severity, crimeType}> }
 * @returns {Object} { crimes: Array<{lat, lon, crimeType, date, severity}> }
 */
router.post('/area', funcs.getCrimesInArea);


/*
{
  "targetLat": 47.6101,
  "targetLon": -122.2015,
  "travelTime": "2026-06-20T23:00:00Z", 
  "crimes": [  your array of incident points  ]
}
*/
/**
 * Generate a report on how safe a route is predicted to be
 * @route 	POST /safetyReport
 * @access 	Public
 * @body	{Object} { targetLat, targetLon, travelTime, crimes }
 * @returns {Object} { safetyConfidence, tier, totalHistoricalIncidentsNearby }
 */
router.post('/safetyReport', funcs.getSafetyConfidence)

export default router;