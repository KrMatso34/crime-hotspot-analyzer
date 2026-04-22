/**
 * KAGS Route Safety Scoring — Express/Fastify Integration
 * =========================================================
 * Streetlight-aware route scoring endpoints.
 * Drop into your existing Express app or import as a router.
 *
 * Usage:
 *   import { createRouter, loadStreetlights } from './routeScoring.js';
 *
 *   // Load data on startup
 *   await loadStreetlights();
 *
 *   // Mount the router
 *   app.use('/api', createRouter());
 */

import express from "express";
import { StreetlightIndex } from "./streetlightIndex.js";

// ============================================================
// GLOBAL STREETLIGHT INDEX — loaded once at startup
// ============================================================

const streetlightIndex = new StreetlightIndex();

/**
 * Call this at server startup to load streetlight data.
 */
async function loadStreetlights() {
  const source = process.env.STREETLIGHT_SOURCE || "local";

  if (source === "s3") {
    const bucket = process.env.KAGS_S3_BUCKET || "kags-crime-data-dev";
    const key = process.env.STREETLIGHT_S3_KEY || "streetlights/seattle_streetlights.geojson";
    await streetlightIndex.loadFromS3(bucket, key);
  } else {
    const localPath = process.env.STREETLIGHT_LOCAL_PATH || "./data/seattle_streetlights.geojson";
    try {
      await streetlightIndex.loadFromFile(localPath);
    } catch (err) {
      console.log(`WARNING: Could not load streetlight data from ${localPath}`);
      console.log("Run 'npm run fetch' first to download the data.");
    }
  }
}

// ============================================================
// SUNSET / SUNRISE HELPERS
// ============================================================

/**
 * Get sunrise/sunset times from the free API.
 * Cache this once per day — don't call per request.
 */
async function getSunTimes(lat = 47.6062, lon = -122.3321, dateStr = null) {
  const date = dateStr || new Date().toISOString().split("T")[0];
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`;

  const resp = await fetch(url);
  const data = (await resp.json()).results;

  return {
    sunrise: new Date(data.sunrise),
    sunset: new Date(data.sunset),
    lightsOn: new Date(data.civil_twilight_end),   // best estimate for photocell trigger
    lightsOff: new Date(data.civil_twilight_begin), // best estimate for photocell trigger
  };
}

// Cache sun times per day
let _sunTimesCache = { date: null, times: null };

async function isNighttimeNow() {
  const today = new Date().toISOString().split("T")[0];

  if (_sunTimesCache.date !== today) {
    try {
      _sunTimesCache = { date: today, times: await getSunTimes() };
    } catch {
      // Fallback: rough Pacific time estimate
      const hour = new Date().getUTCHours() - 7; // rough PDT
      return hour < 6 || hour >= 20;
    }
  }

  const now = new Date();
  const { lightsOn, lightsOff } = _sunTimesCache.times;

  // Lights on in evening, off in morning (overnight)
  return now >= lightsOn || now <= lightsOff;
}

function resolveTimeOfDay(tod) {
  if (tod === "night") return true;
  if (tod === "day") return false;
  return isNighttimeNow(); // "auto"
}

// ============================================================
// ROUTER
// ============================================================

function createRouter() {
  const router = express.Router();

  /**
   * POST /lighting-score
   * Score a route's streetlight coverage.
   */
  router.post("/lighting-score", async (req, res) => {
    if (!streetlightIndex.isLoaded) {
      return res.status(503).json({ error: "Streetlight data not loaded." });
    }

    const { route_points, time_of_day = "auto", light_radius_meters = 80 } = req.body;

    if (!route_points || route_points.length < 2) {
      return res.status(400).json({ error: "Need at least 2 route_points [{lat, lon}]" });
    }

    const isNight = await resolveTimeOfDay(time_of_day);
    const detail = streetlightIndex.lightingDetailForRoute(
      route_points,
      50,
      light_radius_meters
    );

    res.json({
      score: detail.score,
      total_sampled_points: detail.totalSampled,
      lit_points: detail.litCount,
      dark_points: detail.darkCount,
      is_nighttime: isNight,
      applies_to_safety: isNight,
    });
  });

  /**
   * POST /route-safety
   * Combined crime + lighting safety score.
   *
   * During the day:   safety = crime_score (lighting irrelevant)
   * During the night:  safety = 0.65 * crime_score + 0.35 * lighting_score
   */
  router.post("/route-safety", async (req, res) => {
    const { route_points, crime_score, time_of_day = "auto" } = req.body;

    if (crime_score === undefined || crime_score === null) {
      return res.status(400).json({ error: "crime_score is required (0-1)" });
    }
    if (!route_points || route_points.length < 2) {
      return res.status(400).json({ error: "Need at least 2 route_points" });
    }

    const isNight = await resolveTimeOfDay(time_of_day);

    let lightingScore = 0;
    if (streetlightIndex.isLoaded) {
      lightingScore = streetlightIndex.lightingScoreForRoute(route_points);
    }

    // Time-dependent weights
    const crimeWeight = isNight ? 0.65 : 1.0;
    const lightingWeight = isNight ? 0.35 : 0.0;
    const overall = crimeWeight * crime_score + lightingWeight * lightingScore;

    res.json({
      overall_safety: Math.round(overall * 10000) / 10000,
      crime_score,
      lighting_score: Math.round(lightingScore * 10000) / 10000,
      crime_weight: crimeWeight,
      lighting_weight: lightingWeight,
      is_nighttime: isNight,
      streetlight_index_loaded: streetlightIndex.isLoaded,
    });
  });

  /**
   * GET /nearby-lights?lat=47.6062&lon=-122.3321&radius=100
   * Debug endpoint — get streetlights near a point.
   */
  router.get("/nearby-lights", (req, res) => {
    if (!streetlightIndex.isLoaded) {
      return res.status(503).json({ error: "Streetlight data not loaded." });
    }

    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius) || 100;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "lat and lon query params required" });
    }

    const result = streetlightIndex.getNearby(lat, lon, radius);

    res.json({
      count: result.count,
      radius_meters: radius,
      poles: result.poles,
    });
  });

  /**
   * GET /streetlight-status
   * Health check for the streetlight index.
   */
  router.get("/streetlight-status", (req, res) => {
    res.json(streetlightIndex.status());
  });

  return router;
}

export { createRouter, loadStreetlights, streetlightIndex };
