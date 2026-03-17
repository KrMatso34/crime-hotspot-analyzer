from datetime import datetime, timezone


def safe_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except Exception:
        return None


def valid_coords(lat, lon):
    if lat is None or lon is None:
        return False
    return -90 <= lat <= 90 and -180 <= lon <= 180


def parse_datetime_to_utc_iso(value):
    if value is None:
        return None

    # epoch milliseconds / seconds
    if isinstance(value, (int, float)) or (isinstance(value, str) and str(value).isdigit()):
        try:
            numeric = int(value)
            if numeric > 10**11:
                dt = datetime.fromtimestamp(numeric / 1000, tz=timezone.utc)
            else:
                dt = datetime.fromtimestamp(numeric, tz=timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            return None

    # ISO-like string timestamps
    try:
        s = str(value).strip()
        if s.endswith("Z"):
            s = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return None