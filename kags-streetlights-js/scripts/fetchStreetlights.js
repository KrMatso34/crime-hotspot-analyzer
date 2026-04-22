/**
 * KAGS Streetlight Data Fetcher
 * ==============================
 * Pulls all streetlight pole locations from the Seattle City Light ArcGIS REST API.
 * Outputs: GeoJSON and CSV files with lat/lon for every pole where STREETLIGHT='Yes'.
 *
 * Usage:
 *   node scripts/fetchStreetlights.js                     # Save locally
 *   node scripts/fetchStreetlights.js --upload-s3          # Save locally + upload to S3
 *   node scripts/fetchStreetlights.js --upload-dynamodb    # Save locally + push to DynamoDB
 *
 * Requirements:
 *   npm install @aws-sdk/client-s3 @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb ngeohash
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// CONFIG
// ============================================================

const ARCGIS_BASE_URL =
  "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Seattle_City_Light_Poles/FeatureServer/0/query";

const QUERY_PARAMS = {
  where: "STREETLIGHT='Yes'",
  outFields: "ASSET_ID,HEIGHT,STREETLIGHT,SUBTYPECD",
  outSR: "4326",
  f: "geojson",
  resultRecordCount: "2000",
};

const S3_BUCKET = process.env.KAGS_S3_BUCKET || "kags-crime-data";
const S3_KEY_GEOJSON = "streetlights/seattle_streetlights.geojson";
const S3_KEY_CSV = "streetlights/seattle_streetlights.csv";
const DYNAMODB_TABLE = process.env.KAGS_DYNAMODB_TABLE || "kags-streetlights";
const OUTPUT_DIR = path.join(__dirname, "..", "data");

// ============================================================
// FETCH FROM ARCGIS
// ============================================================

async function fetchAllStreetlights() {
  const allFeatures = [];
  let offset = 0;
  let page = 1;

  console.log("=".repeat(60));
  console.log("KAGS Streetlight Data Fetcher");
  console.log("Source: Seattle City Light ArcGIS API");
  console.log("Filter: STREETLIGHT='Yes'");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  while (true) {
    const params = new URLSearchParams({
      ...QUERY_PARAMS,
      resultOffset: String(offset),
    });

    console.log(`\n[Page ${page}] Fetching offset ${offset}...`);

    let data;
    try {
      const resp = await fetch(`${ARCGIS_BASE_URL}?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json();
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      console.log("  Retrying in 5 seconds...");
      await sleep(5000);
      try {
        const resp = await fetch(`${ARCGIS_BASE_URL}?${params}`);
        data = await resp.json();
      } catch (err2) {
        console.log(`  FATAL: Retry failed: ${err2.message}`);
        break;
      }
    }

    const features = data?.features || [];
    if (features.length === 0) {
      console.log("  No more features. Done.");
      break;
    }

    // Validate coordinates are in Pacific NW
    let valid = 0;
    for (const f of features) {
      const coords = f?.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        const [lon, lat] = coords;
        if (lat > 46.5 && lat < 48.5 && lon > -123.0 && lon < -121.5) {
          allFeatures.push(f);
          valid++;
        }
      }
    }

    console.log(
      `  Got ${features.length} features, ${valid} valid. Total so far: ${allFeatures.length}`
    );

    offset += 2000;
    page++;
    await sleep(300); // Be polite to the server
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL STREETLIGHT POLES FETCHED: ${allFeatures.length}`);
  console.log("=".repeat(60));

  return allFeatures;
}

// ============================================================
// SAVE TO FILES
// ============================================================

function saveGeoJSON(features, filepath) {
  const geojson = {
    type: "FeatureCollection",
    metadata: {
      source: "Seattle City Light ArcGIS REST API",
      filter: "STREETLIGHT='Yes'",
      fetched_at: new Date().toISOString(),
      total_features: features.length,
      crs: "EPSG:4326 (WGS84)",
      project: "KAGS - Crime-Aware Routing System",
    },
    features,
  };

  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(geojson));

  const sizeMB = (fs.statSync(filepath).size / (1024 * 1024)).toFixed(1);
  console.log(`Saved GeoJSON: ${filepath} (${sizeMB} MB)`);
  return filepath;
}

function saveCSV(features, filepath) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });

  const header = "pole_id,latitude,longitude,height_ft,has_streetlight,subtype\n";
  const rows = features.map((f) => {
    const coords = f.geometry.coordinates;
    const props = f.properties || {};
    return [
      props.ASSET_ID || "",
      coords[1].toFixed(7), // lat
      coords[0].toFixed(7), // lon
      props.HEIGHT || "",
      props.STREETLIGHT || "Yes",
      props.SUBTYPECD || "",
    ].join(",");
  });

  fs.writeFileSync(filepath, header + rows.join("\n"));

  const sizeMB = (fs.statSync(filepath).size / (1024 * 1024)).toFixed(1);
  console.log(`Saved CSV: ${filepath} (${sizeMB} MB)`);
  return filepath;
}

// ============================================================
// UPLOAD TO S3
// ============================================================

async function uploadToS3(filepath, bucket, key) {
  let S3Client, PutObjectCommand;
  try {
    const s3Mod = await import("@aws-sdk/client-s3");
    S3Client = s3Mod.S3Client;
    PutObjectCommand = s3Mod.PutObjectCommand;
  } catch {
    console.log("ERROR: @aws-sdk/client-s3 not installed. Run: npm install @aws-sdk/client-s3");
    return false;
  }

  console.log(`\nUploading to s3://${bucket}/${key}...`);
  try {
    const client = new S3Client({});
    const body = fs.readFileSync(filepath);
    const contentType = key.endsWith(".geojson")
      ? "application/geo+json"
      : "text/csv";

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    console.log(`  SUCCESS: s3://${bucket}/${key}`);
    return true;
  } catch (err) {
    console.log(`  ERROR uploading to S3: ${err.message}`);
    return false;
  }
}

// ============================================================
// UPLOAD TO DYNAMODB (with geohash for spatial queries)
// ============================================================

async function uploadToDynamoDB(features, tableName) {
  let DynamoDBClient, DynamoDBDocumentClient, BatchWriteCommand;
  let ngeohash;

  try {
    const dynMod = await import("@aws-sdk/client-dynamodb");
    const libMod = await import("@aws-sdk/lib-dynamodb");
    DynamoDBClient = dynMod.DynamoDBClient;
    DynamoDBDocumentClient = libMod.DynamoDBDocumentClient;
    BatchWriteCommand = libMod.BatchWriteCommand;
    ngeohash = (await import("ngeohash")).default;
  } catch {
    console.log(
      "ERROR: Install dependencies: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb ngeohash"
    );
    return false;
  }

  console.log(`\nUploading ${features.length} records to DynamoDB table '${tableName}'...`);

  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  let count = 0;
  let errors = 0;

  // DynamoDB BatchWrite handles 25 items at a time
  const batchSize = 25;
  for (let i = 0; i < features.length; i += batchSize) {
    const batch = features.slice(i, i + batchSize);
    const requests = [];

    for (const feature of batch) {
      try {
        const [lon, lat] = feature.geometry.coordinates;
        const props = feature.properties || {};
        const poleId = props.ASSET_ID || `unknown_${count}`;

        const gh6 = ngeohash.encode(lat, lon, 6);
        const gh7 = ngeohash.encode(lat, lon, 7);

        requests.push({
          PutRequest: {
            Item: {
              geohash6: gh6,
              pole_id: poleId,
              geohash7: gh7,
              lat: String(lat.toFixed(7)),
              lon: String(lon.toFixed(7)),
              height_ft: parseInt(props.HEIGHT) || 0,
              source: "seattle_city_light",
              fetched_at: new Date().toISOString(),
            },
          },
        });
        count++;
      } catch {
        errors++;
      }
    }

    if (requests.length > 0) {
      try {
        await client.send(
          new BatchWriteCommand({
            RequestItems: { [tableName]: requests },
          })
        );
      } catch (err) {
        errors += requests.length;
        if (errors <= 5) console.log(`  ERROR on batch: ${err.message}`);
      }
    }

    if (count % 5000 === 0 && count > 0) {
      console.log(`  Written ${count} records...`);
    }
  }

  console.log(`  DONE: ${count} records written, ${errors} errors`);
  return true;
}

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    uploadS3: args.includes("--upload-s3"),
    uploadDynamo: args.includes("--upload-dynamodb"),
    s3Bucket: getArgValue(args, "--s3-bucket") || S3_BUCKET,
    dynamoTable: getArgValue(args, "--dynamodb-table") || DYNAMODB_TABLE,
    outputDir: getArgValue(args, "--output-dir") || OUTPUT_DIR,
  };
}

function getArgValue(args, flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = parseArgs();

  // 1. Fetch all streetlights
  const features = await fetchAllStreetlights();

  if (!features.length) {
    console.log("\nERROR: No features fetched. Check network / API status.");
    process.exit(1);
  }

  // 2. Save locally
  const geojsonPath = path.join(args.outputDir, "seattle_streetlights.geojson");
  const csvPath = path.join(args.outputDir, "seattle_streetlights.csv");

  saveGeoJSON(features, geojsonPath);
  saveCSV(features, csvPath);

  // 3. Upload to S3 if requested
  if (args.uploadS3) {
    await uploadToS3(geojsonPath, args.s3Bucket, S3_KEY_GEOJSON);
    await uploadToS3(csvPath, args.s3Bucket, S3_KEY_CSV);
  }

  // 4. Upload to DynamoDB if requested
  if (args.uploadDynamo) {
    await uploadToDynamoDB(features, args.dynamoTable);
  }

  // 5. Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total streetlight poles: ${features.length}`);
  console.log(`Local GeoJSON:          ${geojsonPath}`);
  console.log(`Local CSV:              ${csvPath}`);
  if (args.uploadS3) {
    console.log(`S3 GeoJSON:             s3://${args.s3Bucket}/${S3_KEY_GEOJSON}`);
    console.log(`S3 CSV:                 s3://${args.s3Bucket}/${S3_KEY_CSV}`);
  }
  if (args.uploadDynamo) {
    console.log(`DynamoDB Table:         ${args.dynamoTable}`);
  }
  console.log("=".repeat(60));
}

main();
