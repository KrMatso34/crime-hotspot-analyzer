# KAGS Streetlight Data — Handoff for Saksham

> **Hey Saksham,**
>
> This is the streetlight module for KAGS. Everything is in JavaScript to match our stack. I need you to set up the AWS side (S3 + DynamoDB) and wire it into our backend.

---

## What This Does

1. **Pulls lat/lon of every streetlight** in Seattle (~50,000 poles) from Seattle City Light's public API
2. **Calculates when lights are on/off** using sunrise/sunset data + photocell behavior
3. **Scores any route** by sampling points along it and counting nearby streetlights

---

## What's In Here

```
kags-streetlights/
├── scripts/
│   ├── fetchStreetlights.js       # Pulls all streetlight lat/lon from Seattle's ArcGIS API
│   ├── streetlightIndex.js        # In-memory RBush for fast "lights near this point" queries
│   ├── dynamoStreetlights.js      # DynamoDB query alternative (for Lambda/serverless)
│   └── routeScoring.js            # Express endpoints to plug into our backend
├── data/
│   └── streetlight_timing.json    # When lights turn on/off + sunrise/sunset API info
├── config/
│   └── cloudformation.yaml        # One command deploys: S3 bucket + DynamoDB table + IAM
├── package.json
└── README.md
```

---

## What I Need You To Do

### Step 1: Deploy AWS Infrastructure

```bash
aws cloudformation deploy \
  --template-file config/cloudformation.yaml \
  --stack-name kags-streetlights-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

This creates the S3 bucket, DynamoDB table (geohash-indexed), and IAM role.

### Step 2: Fetch the Data and Upload

```bash
npm install

# Fetch all streetlights + push to S3 and DynamoDB
node scripts/fetchStreetlights.js --upload-s3 --upload-dynamodb \
  --s3-bucket kags-crime-data-dev \
  --dynamodb-table kags-streetlights-dev
```

Takes a few minutes. Outputs ~50,000 poles to local files + AWS.

### Step 3: Wire Into Our Backend

In your existing Express app:

```javascript
import { createRouter, loadStreetlights } from './scripts/routeScoring.js';

// Load streetlight data on startup
await loadStreetlights();

// Mount the endpoints
app.use('/api', createRouter());
```

Set env vars:

```bash
# Production (load from S3)
export STREETLIGHT_SOURCE=s3
export KAGS_S3_BUCKET=kags-crime-data-dev
export STREETLIGHT_S3_KEY=streetlights/seattle_streetlights.geojson

# Local dev (load from file)
export STREETLIGHT_SOURCE=local
export STREETLIGHT_LOCAL_PATH=./data/seattle_streetlights.geojson
```

### Step 4: Monthly Refresh

Streetlight positions barely change. Cron it monthly:

```cron
0 6 1 * * cd /path/to/project && node scripts/fetchStreetlights.js --upload-s3 --upload-dynamodb
```

---

## The Data Source (Live API)

**Seattle City Light ArcGIS REST API** — free, public, no key needed:

```
https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Seattle_City_Light_Poles/FeatureServer/0/query
```

Each record has: **lat/lon**, **ASSET_ID** (pole ID), **HEIGHT** (feet), **STREETLIGHT** (Yes/No).

---

## Streetlight Timing (When Lights Are On/Off)

Full details in `data/streetlight_timing.json`. Short version:

Streetlights use **photocell sensors** — on at dusk, off at dawn. No real-time on/off API exists. We use the free sunrise-sunset.org API:

```javascript
const resp = await fetch(
  'https://api.sunrise-sunset.org/json?lat=47.6062&lng=-122.3321&formatted=0'
);
const data = (await resp.json()).results;

const lightsOn  = new Date(data.civil_twilight_end);   // ~dusk
const lightsOff = new Date(data.civil_twilight_begin);  // ~dawn
```

Cache once per day. This is already built into `routeScoring.js`.

| Season | Lights ON | Lights OFF |
|--------|-----------|------------|
| Winter (Dec-Jan) | ~4:15 PM | ~7:30 AM |
| Spring (Mar-Apr) | ~7:30 PM | ~6:00 AM |
| Summer (Jun-Jul) | ~9:15 PM | ~5:15 AM |
| Fall (Oct-Nov) | ~6:00 PM | ~6:45 AM |

---

## API Endpoints (after wiring in)

**`POST /api/lighting-score`** — Score a route's streetlight coverage
```json
// Request
{ "route_points": [{"lat": 47.6062, "lon": -122.3321}, ...], "time_of_day": "night" }

// Response
{ "score": 0.72, "lit_points": 18, "dark_points": 7, "is_nighttime": true }
```

**`POST /api/route-safety`** — Combined crime + lighting score
```json
// Request
{ "route_points": [...], "crime_score": 0.65, "time_of_day": "auto" }

// Response
{ "overall_safety": 0.6745, "crime_weight": 0.65, "lighting_weight": 0.35 }
```

**`GET /api/nearby-lights?lat=47.6062&lon=-122.3321&radius=100`** — Debug/visualization

**`GET /api/streetlight-status`** — Health check

---

## DynamoDB Table Schema

| Field | Type | Key | Description |
|-------|------|-----|-------------|
| `geohash6` | String | Partition Key | ~1.2km grid cell |
| `pole_id` | String | Sort Key | 7-digit pole ID |
| `geohash7` | String | GSI Hash Key | ~150m grid cell |
| `lat` | String | — | Latitude |
| `lon` | String | — | Longitude |
| `height_ft` | Number | — | Pole height in feet |

---

## Questions For You

1. Which AWS region is the rest of KAGS in?
2. Are we using Express or something else for the backend?
3. Is there a CI/CD pipeline I should hook the CloudFormation deploy into?
