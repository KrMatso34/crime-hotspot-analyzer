# Identify Data Formatting (CSV, API, JSON) – KAGS

## Overview
This sprint focuses on identifying appropriate data formats for the KAGS (Crime Hotspot Analyzer) application and validating system performance using benchmark tests.

---

## Data Formatting Strategy

### CSV (Data Ingestion)
- CSV is used for ingesting public crime datasets from city open-data portals.
- CSV is well-suited for bulk, tabular data and historical archives.
- These datasets are imported and normalized before being stored in the database.

### API (Data Access Layer)
- KAGS exposes an API that the frontend uses to request crime data dynamically.
- The API allows filtering by time range, bounding box, and record limits.
- This approach avoids loading large datasets directly into the client.

### JSON / GeoJSON (Data Exchange)
- JSON is used for standard API responses (metadata, statistics).
- GeoJSON is used for geospatial data displayed on the map (crime points and hotspots).
- This format integrates cleanly with map-rendering libraries.

This separation improves scalability, performance, and maintainability.

---

## Performance Benchmarks

To validate performance, benchmark scripts were added to measure latency and throughput for critical KAGS operations.

### API Benchmarks
- Script: `scripts/bench/api-load.mjs`
- Tool: autocannon
- Purpose: Measure response time and request throughput for API endpoints used by the frontend map.

### Query Benchmarks
- Script: `scripts/bench/query-bench.mjs`
- Purpose: Measure latency of database queries used for incident retrieval and spatial filtering.

These benchmarks establish baseline performance metrics for future optimization.

---

## Sprint Outcome
- Identified and justified data formats used by KAGS (CSV, API, JSON/GeoJSON)
- Added reproducible benchmark scripts tied directly to KAGS functionality
- Established a foundation for performance evaluation in future sprints
