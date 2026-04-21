/**
 * KAGS Streetlight Spatial Index
 * ================================
 * Loads streetlight data from S3 or local file into an RBush spatial index.
 * Used at route-scoring time to quickly count streetlights near any lat/lon point.
 *
 * Loaded ONCE at server startup, kept in memory (~5MB for ~50k poles).
 *
 * Usage:
 *   import { StreetlightIndex } from './streetlightIndex.js';
 *
 *   const index = new StreetlightIndex();
 *   await index.loadFromFile('./data/seattle_streetlights.geojson');
 *   // OR
 *   await index.loadFromS3('kags-crime-data-dev', 'streetlights/seattle_streetlights.geojson');
 *
 *   const count = index.countNearby(47.6062, -122.3321, 100);
 *   const score = index.lightingScoreForRoute(routePoints);
 *
 * Requirements:
 *   npm install rbush
 */

import fs from "fs";
import RBush from "rbush";

class StreetlightIndex {
  constructor() {
    this._tree = new RBush();
    this._poles = [];
    this._loaded = false;
    this._source = "";
    this._loadedAt = null;
    this._count = 0;
  }

  get isLoaded() {
    return this._loaded;
  }
  get totalPoles() {
    return this._count;
  }

  // ============================================================
  // LOADING
  // ============================================================

  async loadFromFile(filepath) {
    console.log(`[StreetlightIndex] Loading from ${filepath}...`);
    const raw = fs.readFileSync(filepath, "utf-8");
    const data = JSON.parse(raw);
    this._buildIndex(data.features || []);
    this._source = filepath;
    this._loadedAt = new Date();
    console.log(`[StreetlightIndex] Loaded ${this._count} poles from local file`);
    return this._count;
  }

  async loadFromS3(bucket, key) {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");

    console.log(`[StreetlightIndex] Loading from s3://${bucket}/${key}...`);

    const client = new S3Client({});
    const resp = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const body = await resp.Body.transformToString();
    const data = JSON.parse(body);

    this._buildIndex(data.features || []);
    this._source = `s3://${bucket}/${key}`;
    this._loadedAt = new Date();
    console.log(`[StreetlightIndex] Loaded ${this._count} poles from S3`);
    return this._count;
  }

  _buildIndex(features) {
    this._poles = [];
    const items = [];

    for (const feature of features) {
      const coords = feature?.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const [lon, lat] = coords;
      const props = feature.properties || {};

      const pole = {
        poleId: String(props.ASSET_ID || `pole_${this._poles.length}`),
        lat,
        lon,
        heightFt: parseInt(props.HEIGHT) || 0,
      };

      this._poles.push(pole);

      // RBush expects { minX, minY, maxX, maxY }
      items.push({
        minX: lon,
        minY: lat,
        maxX: lon,
        maxY: lat,
        index: this._poles.length - 1,
      });
    }

    this._tree.load(items);
    this._count = this._poles.length;
    this._loaded = true;
  }

  // ============================================================
  // SPATIAL QUERIES
  // ============================================================

  /**
   * Convert meters to approximate degree offsets at a given latitude.
   * At 47.6°N (Seattle): 1° lat ≈ 111km, 1° lon ≈ 74.8km
   */
  static _metersToDegrees(meters, latitude) {
    const latOffset = meters / 111000;
    const lonOffset = meters / (111000 * Math.cos((latitude * Math.PI) / 180));
    return { lonOffset, latOffset };
  }

  /**
   * Haversine distance between two points in meters.
   */
  static _haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Find all streetlight poles within `radiusMeters` of a point.
   * Returns { count, poles }
   */
  getNearby(lat, lon, radiusMeters = 100) {
    if (!this._loaded) throw new Error("StreetlightIndex not loaded. Call loadFrom*() first.");

    const { lonOffset, latOffset } = StreetlightIndex._metersToDegrees(radiusMeters, lat);

    // RBush bounding box query
    const hits = this._tree.search({
      minX: lon - lonOffset,
      minY: lat - latOffset,
      maxX: lon + lonOffset,
      maxY: lat + latOffset,
    });

    // Filter by actual haversine distance
    const poles = [];
    for (const hit of hits) {
      const pole = this._poles[hit.index];
      const dist = StreetlightIndex._haversineMeters(lat, lon, pole.lat, pole.lon);
      if (dist <= radiusMeters) {
        poles.push(pole);
      }
    }

    return { count: poles.length, poles };
  }

  /**
   * Count streetlight poles within radius. Fast path for route scoring.
   */
  countNearby(lat, lon, radiusMeters = 100) {
    return this.getNearby(lat, lon, radiusMeters).count;
  }

  // ============================================================
  // ROUTE SCORING
  // ============================================================

  /**
   * Score a route's streetlight coverage.
   *
   * @param {Array<{lat: number, lon: number}>} routePoints - Points along the route
   * @param {number} sampleIntervalMeters - Sample every N meters (default 50)
   * @param {number} lightRadiusMeters - "Lit" if a streetlight is within this distance (default 80)
   * @returns {number} 0.0 (completely dark) to 1.0 (fully lit)
   */
  lightingScoreForRoute(routePoints, sampleIntervalMeters = 50, lightRadiusMeters = 80) {
    if (!routePoints || routePoints.length < 2) return 0;

    const sampled = this._sampleRoute(routePoints, sampleIntervalMeters);
    if (sampled.length === 0) return 0;

    let lit = 0;
    for (const { lat, lon } of sampled) {
      if (this.countNearby(lat, lon, lightRadiusMeters) > 0) {
        lit++;
      }
    }

    return lit / sampled.length;
  }

  /**
   * Detailed lighting analysis — returns per-segment breakdown for frontend visualization.
   */
  lightingDetailForRoute(routePoints, sampleIntervalMeters = 50, lightRadiusMeters = 80) {
    if (!routePoints || routePoints.length < 2) {
      return { score: 0, segments: [], totalSampled: 0, litCount: 0, darkCount: 0 };
    }

    const sampled = this._sampleRoute(routePoints, sampleIntervalMeters);
    const segments = [];
    let litCount = 0;

    for (const { lat, lon } of sampled) {
      const result = this.getNearby(lat, lon, lightRadiusMeters);
      const isLit = result.count > 0;
      if (isLit) litCount++;
      segments.push({ lat, lon, isLit, nearbyLights: result.count });
    }

    const score = sampled.length > 0 ? litCount / sampled.length : 0;

    return {
      score: Math.round(score * 10000) / 10000,
      totalSampled: sampled.length,
      litCount,
      darkCount: sampled.length - litCount,
      segments,
    };
  }

  /**
   * Sample points along a polyline at regular intervals.
   */
  _sampleRoute(points, intervalMeters) {
    if (points.length < 2) return [...points];

    const sampled = [points[0]];
    let remaining = 0;

    for (let i = 1; i < points.length; i++) {
      const { lat: lat1, lon: lon1 } = points[i - 1];
      const { lat: lat2, lon: lon2 } = points[i];
      const segDist = StreetlightIndex._haversineMeters(lat1, lon1, lat2, lon2);

      if (segDist === 0) continue;

      let d = remaining;
      while (d < segDist) {
        const frac = d / segDist;
        sampled.push({
          lat: lat1 + frac * (lat2 - lat1),
          lon: lon1 + frac * (lon2 - lon1),
        });
        d += intervalMeters;
      }
      remaining = d - segDist;
    }

    return sampled;
  }

  // ============================================================
  // STATUS
  // ============================================================

  status() {
    return {
      loaded: this._loaded,
      totalPoles: this._count,
      source: this._source,
      loadedAt: this._loadedAt ? this._loadedAt.toISOString() : null,
      memoryEstimateMB: Math.round(this._count * 0.00008 * 100) / 100,
    };
  }
}

export { StreetlightIndex };
