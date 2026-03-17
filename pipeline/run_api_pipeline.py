import os
import json
import argparse
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from pipeline.api.fetch_seattle import fetch_seattle
from pipeline.api.fetch_kingcounty import fetch_kingcounty
from pipeline.api.fetch_bellevue import fetch_bellevue
from pipeline.api.flatten_bellevue import flatten_bellevue_feature

from pipeline.src.normalize import parse_datetime_to_utc_iso, safe_float, valid_coords
from pipeline.src.bias_filter import apply_bias_filter


BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
MAPPINGS_DIR = os.path.join(BASE_DIR, "mappings")


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_mapping(mapping_name: str) -> Dict[str, Any]:
    path = os.path.join(MAPPINGS_DIR, mapping_name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Mapping file not found: {path}")
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


def make_event_id(source_city: str, occurred_at_utc: str, lat: Optional[float], lon: Optional[float], event_type: str, case_number: str) -> str:
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


def normalize_event(event: Dict[str, Any], stats: Dict[str, int]) -> Optional[Dict[str, Any]]:
    event_type = (event.get("event_type") or "").strip()
    if not event_type:
        stats["rows_dropped_missing_required"] += 1
        return None
    event["event_type"] = event_type.upper()

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

    event["ingested_at_utc"] = utc_now()
    return event


def fetch_source_rows(source: str, limit: int) -> List[Dict[str, Any]]:
    if source == "seattle":
        return fetch_seattle(limit=limit)

    if source == "kingcounty":
        return fetch_kingcounty(limit=limit)

    if source == "bellevue":
        features = fetch_bellevue()
        rows = [flatten_bellevue_feature(f) for f in features]
        if limit > 0:
            return rows[:limit]
        return rows

    raise ValueError(f"Unsupported source: {source}")


def run_api_pipeline(source: str, mapping_name: str, limit: int):
    ensure_output_dir()
    mapping = load_mapping(mapping_name)

    stats = {
        "rows_read": 0,
        "rows_written": 0,
        "rows_dropped_missing_required": 0,
        "rows_dropped_invalid_coords": 0,
        "bias_fields_removed_total": 0
    }

    rows = fetch_source_rows(source, limit)
    stats["rows_read"] = len(rows)

    cleaned_events: List[Dict[str, Any]] = []

    for row in rows:
        event = map_row_to_event(row, mapping)
        event = normalize_event(event, stats)
        if event is None:
            continue

        event, removed = apply_bias_filter(event)
        stats["bias_fields_removed_total"] += removed

        cleaned_events.append(event)

    stats["rows_written"] = len(cleaned_events)

    jsonl_path = os.path.join(OUTPUT_DIR, f"{source}_cleaned_events.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for ev in cleaned_events:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")

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
                "event_subtype": ev.get("event_subtype"),
                "occurred_at_utc": ev.get("occurred_at_utc"),
                "source_city": ev.get("source_city"),
                "address_line": ev.get("address_line")
            }
        })

    geojson = {"type": "FeatureCollection", "features": features}
    geojson_path = os.path.join(OUTPUT_DIR, f"{source}_cleaned.geojson")
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f)

    report_path = os.path.join(OUTPUT_DIR, f"{source}_etl_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("API ETL Pipeline Report\n")
        f.write(f"run_time_utc: {utc_now()}\n\n")
        f.write(f"source: {source}\n")
        f.write(f"mapping_used: {mapping_name}\n\n")
        for k, v in stats.items():
            f.write(f"{k}: {v}\n")

    print("API ETL Pipeline Complete")
    print(f"- {jsonl_path}")
    print(f"- {geojson_path}")
    print(f"- {report_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, choices=["seattle", "kingcounty", "bellevue"])
    parser.add_argument("--mapping", required=True)
    parser.add_argument("--limit", type=int, default=100)

    args = parser.parse_args()

    run_api_pipeline(
        source=args.source,
        mapping_name=args.mapping,
        limit=args.limit
    )