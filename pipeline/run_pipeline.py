"""
Sprint 3 – ETL Pipeline
----------------------
Purpose:
- Take raw CSV files from storage
- Clean and normalize fields
- Output MongoDB-ready JSONL
- Output GeoJSON for frontend mapping

NOTE:
- AWS (S3) and MongoDB credentials are intentionally not required yet.
- This pipeline runs in local mode for Sprint 3.
"""

import sys
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

import pandas as pd

# =========================
# Paths
# =========================
BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")


# =========================
# Helpers
# =========================
def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_float(value) -> Optional[float]:
    try:
        if pd.isna(value):
            return None
        return float(value)
    except Exception:
        return None


def parse_datetime(value) -> Optional[str]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    dt = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(dt):
        return None
    return dt.isoformat()


# =========================
# Core ETL Logic
# =========================
def normalize_row(row: Dict[str, Any], source: str) -> Optional[Dict[str, Any]]:
    """
    Convert a raw CSV row into a standardized MongoDB-ready document.
    """

    incident_id = (
        row.get("offense_id")
        or row.get("incident_id")
        or row.get("case_number")
        or row.get("report_number")
    )

    timestamp = (
        parse_datetime(row.get("incident_datetime"))
        or parse_datetime(row.get("offense_date"))
        or parse_datetime(row.get("report_date"))
    )

    category = (
        row.get("offense_sub_category")
        or row.get("offense_category")
        or row.get("nibrs_code_name")
        or row.get("crime_type")
    )

    if not incident_id or not timestamp or not category:
        return None

    lat = safe_float(row.get("latitude"))
    lon = safe_float(row.get("longitude"))

    location = None
    if lat is not None and lon is not None:
        location = {
            "type": "Point",
            "coordinates": [lon, lat]
        }

    return {
        "_id": str(incident_id),
        "incident_id": str(incident_id),
        "timestamp": timestamp,
        "category": category,
        "address": row.get("address") or row.get("block_address"),
        "city": row.get("city"),
        "state": row.get("state"),
        "location": location,
        "source": source,
        "ingested_at": utc_now(),
        "raw": row
    }


def run_pipeline(csv_paths: List[str]):
    ensure_output_dir()

    stats = {
        "rows_read": 0,
        "rows_written": 0,
        "rows_dropped": 0
    }

    cleaned_docs = []

    for csv_path in csv_paths:
        df = pd.read_csv(csv_path)
        stats["rows_read"] += len(df)

        for _, row in df.iterrows():
            doc = normalize_row(row.to_dict(), source="storage_csv")
            if doc is None:
                stats["rows_dropped"] += 1
                continue

            cleaned_docs.append(doc)

    stats["rows_written"] = len(cleaned_docs)

    # =========================
    # Write JSONL (Mongo-ready)
    # =========================
    jsonl_path = os.path.join(OUTPUT_DIR, "cleaned.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for doc in cleaned_docs:
            f.write(json.dumps(doc, ensure_ascii=False) + "\n")

    # =========================
    # Write GeoJSON (Frontend)
    # =========================
    features = []
    for d in cleaned_docs:
        if d["location"] is not None:
            features.append({
                "type": "Feature",
                "geometry": d["location"],
                "properties": {
                    "incident_id": d["incident_id"],
                    "timestamp": d["timestamp"],
                    "category": d["category"],
                    "address": d.get("address"),
                    "city": d.get("city")
                }
            })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    geojson_path = os.path.join(OUTPUT_DIR, "cleaned.geojson")
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f)

    # =========================
    # Write ETL Report
    # =========================
    report_path = os.path.join(OUTPUT_DIR, "etl_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("Sprint 3 ETL Pipeline Report\n")
        f.write(f"run_time_utc: {utc_now()}\n\n")
        for k, v in stats.items():
            f.write(f"{k}: {v}\n")

    print("ETL Pipeline Complete")
    print(f"- {jsonl_path}")
    print(f"- {geojson_path}")
    print(f"- {report_path}")


# =========================
# Entry Point
# =========================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pipeline/run_pipeline.py <csv1> [csv2] ...")
        sys.exit(1)

    run_pipeline(sys.argv[1:])
