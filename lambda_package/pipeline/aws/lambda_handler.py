import os
import math
import json
import hashlib
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

import boto3

from pipeline.aws.checkpoint_store import get_checkpoint, set_checkpoint
from pipeline.api.fetch_seattle import fetch_seattle
from pipeline.api.fetch_bellevue import fetch_bellevue
from pipeline.api.flatten_bellevue import flatten_bellevue_feature
from pipeline.src.normalize import parse_datetime_to_utc_iso, safe_float, valid_coords
from pipeline.src.bias_filter import apply_bias_filter


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MAPPINGS_DIR = os.path.join(BASE_DIR, "mappings")

DYNAMO_TABLE = os.environ.get("DYNAMO_TABLE", "CrimeEvents")
FETCH_LIMIT = int(os.environ.get("FETCH_LIMIT", "100"))

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(DYNAMO_TABLE)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_mapping(mapping_name: str) -> Dict[str, Any]:
    path = os.path.join(MAPPINGS_DIR, mapping_name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_nested(d: Dict[str, Any], key_path: str) -> Any:
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


def make_event_id(
    source_city: str,
    occurred_at_utc: str,
    lat: Optional[float],
    lon: Optional[float],
    event_type: str,
    case_number: str
) -> str:
    raw = f"{source_city}|{occurred_at_utc}|{lat}|{lon}|{event_type}|{case_number}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:20]


def map_row_to_event(row: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    event: Dict[str, Any] = {}
    event["source_system"] = mapping.get("source_system", "unknown_source")
    event["source_city"] = mapping.get("source_city", "unknown_city")

    for unified_key, raw_key in mapping.items():
        if unified_key in ("source_system", "source_city"):
            continue
        if not isinstance(raw_key, str):
            continue

        value = row.get(raw_key)
        set_nested(event, unified_key, value)

    event["raw"] = row
    return event


def decay_weight(days_old: int, half_life: int = 30) -> float:
    return math.exp(-days_old / half_life)


CRIME_PRIORITY_MAP = {
    "HOMICIDE": 5,
    "MURDER": 5,
    "ROBBERY": 4,
    "ASSAULT": 4,
    "AGGRAVATED ASSAULT": 4,
    "BURGLARY": 3,
    "VEHICLE THEFT": 3,
    "THEFT": 2,
    "LARCENY-THEFT": 2,
    "PROPERTY CRIME": 2,
    "WARRANT": 1,
    "ALL OTHER OFFENSES": 1,
    "OTHER": 1
}


def normalize_event(event: Dict[str, Any], stats: Dict[str, int]) -> Optional[Dict[str, Any]]:
    event_type = (event.get("event_type") or "").strip()
    if not event_type:
        stats["rows_dropped_missing_required"] += 1
        return None

    event["event_type"] = event_type.upper()

    normalized_type = event["event_type"]
    normalized_subtype = (event.get("event_subtype") or "").strip().upper()
    event["priority_score"] = (
        CRIME_PRIORITY_MAP.get(normalized_subtype)
        or CRIME_PRIORITY_MAP.get(normalized_type)
        or 1
    )

    occurred_raw = event.get("occurred_at")
    occurred_at_utc = parse_datetime_to_utc_iso(occurred_raw)
    if not occurred_at_utc:
        stats["rows_dropped_missing_required"] += 1
        return None

    event["occurred_at_utc"] = occurred_at_utc

    reported_raw = event.get("reported_at")
    reported_at_utc = parse_datetime_to_utc_iso(reported_raw)
    if reported_at_utc:
        event["reported_at_utc"] = reported_at_utc

    occurred_dt = datetime.fromisoformat(occurred_at_utc.replace("Z", "+00:00"))
    now_dt = datetime.now(timezone.utc)
    cutoff_dt = now_dt - timedelta(days=90)

    if occurred_dt < cutoff_dt:
        stats["rows_dropped_too_old"] += 1
        return None

    age_days = max((now_dt - occurred_dt).days, 0)
    event["age_days"] = age_days
    event["decay_weight"] = round(decay_weight(age_days), 6)
    event["weighted_score"] = round(event["priority_score"] * event["decay_weight"], 4)

    lat = safe_float(get_nested(event, "location.lat"))
    lon = safe_float(get_nested(event, "location.lon"))

    if lat is None or lon is None or not valid_coords(lat, lon):
        stats["rows_dropped_invalid_coords"] += 1
        return None

    event["location"] = {"lat": lat, "lon": lon}

    case_number = str(event.get("case_number") or "").strip()

    event["event_id"] = make_event_id(
        source_city=event.get("source_city", "unknown"),
        occurred_at_utc=occurred_at_utc,
        lat=lat,
        lon=lon,
        event_type=event["event_type"],
        case_number=case_number
    )

    expires_dt = occurred_dt + timedelta(days=90)
    event["expires_at"] = int(expires_dt.timestamp())

    event["ingested_at_utc"] = utc_now()
    return event


def convert_floats_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_floats_to_decimal(v) for v in obj]
    return obj


def batch_write_events(items: List[Dict[str, Any]]) -> int:
    written = 0
    with table.batch_writer(overwrite_by_pkeys=["event_id"]) as batch:
        for item in items:
            batch.put_item(Item=convert_floats_to_decimal(item))
            written += 1
    return written


def process_source(rows: List[Dict[str, Any]], mapping_name: str) -> Dict[str, int]:
    mapping = load_mapping(mapping_name)

    stats = {
        "rows_read": len(rows),
        "rows_written": 0,
        "rows_dropped_missing_required": 0,
        "rows_dropped_invalid_coords": 0,
        "rows_dropped_too_old": 0,
        "bias_fields_removed_total": 0
    }

    cleaned_events: List[Dict[str, Any]] = []

    for row in rows:
        event = map_row_to_event(row, mapping)
        event = normalize_event(event, stats)
        if event is None:
            continue

        event, removed = apply_bias_filter(event)
        stats["bias_fields_removed_total"] += removed
        cleaned_events.append(event)

    stats["rows_written"] = batch_write_events(cleaned_events)
    return stats


def lambda_handler(event, context):
    results = {}

    # Seattle
    seattle_since = get_checkpoint("seattle")
    print("Seattle checkpoint before fetch:", seattle_since)

    seattle_rows = fetch_seattle(limit=FETCH_LIMIT, since=seattle_since)
    results["seattle"] = process_source(seattle_rows, "seattle_mapping.json")

    if seattle_rows:
        newest_seattle = max(
            r["report_date_time"]
            for r in seattle_rows
            if r.get("report_date_time")
        )
        print("Seattle checkpoint updating to:", newest_seattle)
        set_checkpoint("seattle", newest_seattle)

    # Bellevue
    bellevue_since = get_checkpoint("bellevue")
    print("Bellevue checkpoint before fetch:", bellevue_since)

    bellevue_features = fetch_bellevue(limit=FETCH_LIMIT, since=bellevue_since)
    bellevue_rows = [flatten_bellevue_feature(f) for f in bellevue_features]

    results["bellevue"] = process_source(bellevue_rows, "bellevue_mapping.json")

    if bellevue_rows:
        newest_bellevue = max(
            r["REPORT_DATE"]
            for r in bellevue_rows
            if r.get("REPORT_DATE")
        )
        print("Bellevue checkpoint updating to:", newest_bellevue)
        set_checkpoint("bellevue", newest_bellevue)

    print("Lambda ETL run started at", utc_now())
    print("Seattle rows fetched:", len(seattle_rows))
    print("Bellevue rows fetched:", len(bellevue_rows))
    print("Results:", results)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "API ETL Lambda completed",
            "table": DYNAMO_TABLE,
            "results": results
        })
    }