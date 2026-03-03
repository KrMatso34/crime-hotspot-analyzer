DROP_FIELDS = {
    "neighborhood",
    "precinct",
    "beat",
    "sector",
    "reporting_area",
    "district"
}

def apply_bias_filter(event: dict):
    removed = 0

    # 1) remove from meta (nested)
    meta = event.get("meta")
    if isinstance(meta, dict):
        for k in list(meta.keys()):
            if k in DROP_FIELDS:
                meta.pop(k, None)
                removed += 1
        event["meta"] = meta

    # 2) remove from raw (nested)
    raw = event.get("raw")
    if isinstance(raw, dict):
        for k in list(raw.keys()):
            if k in DROP_FIELDS:
                raw.pop(k, None)
                removed += 1
        event["raw"] = raw

    # 3) if you ever store "neighborhood" at top-level
    for k in list(event.keys()):
        if k in DROP_FIELDS:
            event.pop(k, None)
            removed += 1

    return event, removed