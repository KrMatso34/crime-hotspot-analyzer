import * as funcs from './crime.controller.js';
import express from 'express';

const router = express.Router();

/**
 * Get all crime hotspots
 * @route   GET /hotspots
 * @access  Public
 * @returns {Object} { hotspots: Array<{lat, lon, intensity, crimeCount}> }
 */
router.get('/hotspots', funcs.getHotspots);

/**
 * Get crimes in a specific area
 * @route   GET /area
 * @access  Public
 * @query   {Float} lat - Center latitude
 * @query   {Float} lon - Center longitude
 * @query   {Number} radiusKm - Search radius in kilometers (default: 2)
 * @returns {Object} { crimes: Array<{lat, lon, crimeType, date}> }
 */
router.get('/area', funcs.getCrimesInArea);

export default router;
