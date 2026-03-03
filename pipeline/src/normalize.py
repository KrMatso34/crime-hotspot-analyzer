import pandas as pd
from datetime import timezone

def safe_float(value):
    try:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return None
        return float(value)
    except Exception:
        return None

def parse_datetime_to_utc_iso(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    dt = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(dt):
        return None
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def valid_coords(lat, lon) -> bool:
    return (
        lat is not None and lon is not None and
        -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
    )