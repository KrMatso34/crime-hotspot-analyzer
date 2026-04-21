/**
 * KAGS DynamoDB Streetlight Queries
 * ===================================
 * Alternative to the in-memory RBush index.
 * Use this if running on Lambda where you can't keep 50k poles in memory.
 *
 * Trade-off:
 *   - RBush (streetlightIndex.js): ~3ms per route, needs 5MB RAM
 *   - DynamoDB (this file): ~30-50ms per route, no RAM needed
 *
 * Usage:
 *   import { DynamoStreetlightQuery } from './dynamoStreetlights.js';
 *
 *   const db = new DynamoStreetlightQuery('kags-streetlights-dev');
 *   const count = await db.countNearby(47.6062, -122.3321);
 *   const score = await db.lightingScoreForRoute(routePoints);
 *
 * Requirements:
 *   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb ngeohash
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import ngeohash from "ngeohash";

class DynamoStreetlightQuery {
  constructor(tableName, region = "us-east-2") {
    this.tableName = tableName || process.env.KAGS_DYNAMODB_TABLE || "kags-streetlights-dev";
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Count streetlights near a point using geohash neighbors.
   * precision=7 → ~150m cells (good for streetlight radius)
   * precision=6 → ~1.2km cells (broader area)
   */
  async countNearby(lat, lon, precision = 7) {
    const centerHash = ngeohash.encode(lat, lon, precision);
    const neighbors = ngeohash.neighbors(centerHash);
    const cells = [centerHash, ...neighbors];

    const hashKey = `geohash${precision}`;
    const indexName = precision !== 6 ? `geohash${precision}-index` : undefined;

    let total = 0;

    // Query all 9 cells in parallel
    const promises = cells.map(async (cell) => {
      try {
        const params = {
          TableName: this.tableName,
          KeyConditionExpression: `${hashKey} = :gh`,
          ExpressionAttributeValues: { ":gh": cell },
          Select: "COUNT",
        };
        if (indexName) params.IndexName = indexName;

        const resp = await this.docClient.send(new QueryCommand(params));
        return resp.Count || 0;
      } catch {
        return 0;
      }
    });

    const results = await Promise.all(promises);
    total = results.reduce((sum, c) => sum + c, 0);

    return total;
  }

  /**
   * Get full pole records near a point.
   */
  async getNearby(lat, lon, precision = 7) {
    const centerHash = ngeohash.encode(lat, lon, precision);
    const neighbors = ngeohash.neighbors(centerHash);
    const cells = [centerHash, ...neighbors];

    const hashKey = `geohash${precision}`;
    const indexName = precision !== 6 ? `geohash${precision}-index` : undefined;

    const poles = [];

    const promises = cells.map(async (cell) => {
      try {
        const params = {
          TableName: this.tableName,
          KeyConditionExpression: `${hashKey} = :gh`,
          ExpressionAttributeValues: { ":gh": cell },
        };
        if (indexName) params.IndexName = indexName;

        const resp = await this.docClient.send(new QueryCommand(params));
        return (resp.Items || []).map((item) => ({
          poleId: item.pole_id,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          heightFt: item.height_ft || 0,
        }));
      } catch {
        return [];
      }
    });

    const results = await Promise.all(promises);
    for (const batch of results) {
      poles.push(...batch);
    }

    return poles;
  }

  /**
   * Score a route's streetlight coverage using DynamoDB queries.
   */
  async lightingScoreForRoute(routePoints, sampleIntervalMeters = 50) {
    if (!routePoints || routePoints.length < 2) return 0;

    const sampled = this._sampleRoute(routePoints, sampleIntervalMeters);
    if (sampled.length === 0) return 0;

    // Query in batches to avoid hammering DynamoDB
    let lit = 0;
    for (const { lat, lon } of sampled) {
      const count = await this.countNearby(lat, lon, 7);
      if (count > 0) lit++;
    }

    return lit / sampled.length;
  }

  _sampleRoute(points, interval) {
    if (points.length < 2) return [...points];
    const sampled = [points[0]];
    let remaining = 0;

    for (let i = 1; i < points.length; i++) {
      const { lat: lat1, lon: lon1 } = points[i - 1];
      const { lat: lat2, lon: lon2 } = points[i];
      const R = 6371000;
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const seg = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (seg === 0) continue;
      let d = remaining;
      while (d < seg) {
        const f = d / seg;
        sampled.push({ lat: lat1 + f * (lat2 - lat1), lon: lon1 + f * (lon2 - lon1) });
        d += interval;
      }
      remaining = d - seg;
    }
    return sampled;
  }
}

export { DynamoStreetlightQuery };
