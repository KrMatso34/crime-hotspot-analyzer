"""

- Take raw CSV files from storage (local for now; S3 later)
- Map dataset-specific fields into a unified event schema (mapping JSON)
- Normalize timestamps + coordinates
- Apply bias filtering
- Output DB-ready JSONL + GeoJSON + ETL report

NOTE:
- AWS (S3) and DynamoDB/Mongo credentials are not required yet.
- This runs locally and produces outputs that can later be inserted into DynamoDB.
"""

import sys
import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple

import pandas as pd

# If you created these modules from earlier steps:
# pipeline/src/normalize.py
# pipeline/src/bias_filter.py
from pipeline.src.normalize import parse_datetime_to_utc_iso, safe_float, valid_coords
from pipeline.src.bias_filter import apply_bias_filter


# =========================
# Paths
# =========================
BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
MAPPINGS_DIR = os.path.join(BASE_DIR, "mappings")


# =========================
# Helpers
# =========================
def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_mapping(mapping_name: str) -> Dict[str, Any]:
    """
    mapping_name example: "seattle_mapping.json"
    """
    path = os.path.join(MAPPINGS_DIR, mapping_name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Mapping file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_nested(d: Dict[str, Any], key_path: str) -> Any:
    """
    key_path supports dot notation like "location.lat" or "meta.precinct".
    """
    parts = key_path.split(".")
    cur = d
    for p in parts:
        if not isinstance(cur, dict) or p not in cur:
            return None
        cur = cur[p]
    return cur


def set_nested(d: Dict[str, Any], key_path: str, value: Any) -> None:
    parts = key_path.split(".")
    cur = d
    for p in parts[:-1]:
        if p not in cur or not isinstance(cur[p], dict):
            cur[p] = {}
        cur = cur[p]
    cur[parts[-1]] = value


def make_event_id(source_city: str, occurred_at_utc: str, lat: float, lon: float, event_type: str, case_number: str) -> str:
    raw = f"{source_city}|{occurred_at_utc}|{lat}|{lon}|{event_type}|{case_number}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:20]


def map_row_to_event(row: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses mapping json where keys are unified schema fields and values are raw CSV columns.
    Example mapping entry:
      "event_type": "offense_category"
      "location.lat": "latitude"
    """
    event: Dict[str, Any] = {}

    # required constants from mapping file
    event["source_system"] = mapping.get("source_system", "unknown_source")
    event["source_city"] = mapping.get("source_city", "unknown_city")

    # apply field mappings
    for unified_key, raw_key in mapping.items():
        if unified_key in ("source_system", "source_city"):
            continue
        if not isinstance(raw_key, str):
            continue

        value = row.get(raw_key)
        set_nested(event, unified_key, value)

    # store raw row (optional but useful for traceability)
    event["raw"] = row
    return event


def normalize_event(event: Dict[str, Any], stats: Dict[str, int]) -> Optional[Dict[str, Any]]:
    """
    Normalizes time + coords, validates required fields.
    Returns a DB-ready event dict or None if dropped.
    """

    # event_type
    event_type = (event.get("event_type") or "").strip()
    if not event_type:
        stats["rows_dropped_missing_required"] += 1
        return None
    event["event_type"] = event_type.upper()

    # occurred_at_utc
    occurred_raw = event.get("occurred_at")
    occurred_at_utc = parse_datetime_to_utc_iso(occurred_raw)
    if not occurred_at_utc:
        stats["rows_dropped_missing_required"] += 1
        return None
    event["occurred_at_utc"] = occurred_at_utc

    # reported_at_utc (optional)
    reported_raw = event.get("reported_at")
    reported_at_utc = parse_datetime_to_utc_iso(reported_raw)
    if reported_at_utc:
        event["reported_at_utc"] = reported_at_utc

    # coords
    lat = safe_float(get_nested(event, "location.lat"))
    lon = safe_float(get_nested(event, "location.lon"))

    if not valid_coords(lat, lon):
        stats["rows_dropped_invalid_coords"] += 1
        return None

    # ensure location is consistent
    event["location"] = {"lat": lat, "lon": lon}

    # address (optional)
    addr = (event.get("address_line") or "").strip()
    if addr:
        event["address_line"] = addr

    # case_number (optional but helpful)
    case_number = str(event.get("case_number") or "").strip()

    # generate event_id
    event["event_id"] = make_event_id(
        source_city=event.get("source_city", "unknown"),
        occurred_at_utc=occurred_at_utc,
        lat=lat,
        lon=lon,
        event_type=event["event_type"],
        case_number=case_number
    )

    # ingest time
    event["ingested_at_utc"] = utc_now()

    return event


# =========================
# Core Pipeline
# =========================
def run_pipeline(csv_paths: List[str], mapping_name: str):
    ensure_output_dir()
    mapping = load_mapping(mapping_name)

    stats = {
        "rows_read": 0,
        "rows_written": 0,
        "rows_dropped_missing_required": 0,
        "rows_dropped_invalid_coords": 0,
        "bias_fields_removed_total": 0
    }

    cleaned_events: List[Dict[str, Any]] = []

    for csv_path in csv_paths:
        df = pd.read_csv(csv_path)
        stats["rows_read"] += len(df)

        for _, row in df.iterrows():
            raw = row.to_dict()

            # 1) map raw row -> unified event
            event = map_row_to_event(raw, mapping)

            # 2) normalize + validate
            event = normalize_event(event, stats)
            if event is None:
                continue

            # 3) bias filter
            event, removed = apply_bias_filter(event)
            stats["bias_fields_removed_total"] += removed

            cleaned_events.append(event)

    stats["rows_written"] = len(cleaned_events)

    # =========================
    # Write JSONL (DB-ready)
    # =========================
    jsonl_path = os.path.join(OUTPUT_DIR, "cleaned_events.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for ev in cleaned_events:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")

    # =========================
    # Write GeoJSON (Frontend)
    # =========================
    features = []
    for ev in cleaned_events:
        lat = get_nested(ev, "location.lat")
        lon = get_nested(ev, "location.lon")
        if lat is None or lon is None:
            continue

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "event_id": ev.get("event_id"),
                "event_type": ev.get("event_type"),
                "occurred_at_utc": ev.get("occurred_at_utc"),
                "source_city": ev.get("source_city"),
                "address_line": ev.get("address_line")
            }
        })

    geojson = {"type": "FeatureCollection", "features": features}
    geojson_path = os.path.join(OUTPUT_DIR, "cleaned.geojson")
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f)

    # =========================
    # Write ETL Report (Proof)
    # =========================
    report_path = os.path.join(OUTPUT_DIR, "etl_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("ETL Pipeline Report\n")
        f.write(f"run_time_utc: {utc_now()}\n\n")
        f.write(f"mapping_used: {mapping_name}\n\n")
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
        print("Optional: set PIPELINE_MAPPING env var, default=seattle_mapping.json")
        sys.exit(1)

    mapping_name = os.environ.get("PIPELINE_MAPPING", "seattle_mapping.json")
    run_pipeline(sys.argv[1:], mapping_name=mapping_name)