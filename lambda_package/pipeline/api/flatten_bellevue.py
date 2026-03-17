def flatten_bellevue_feature(feature: dict) -> dict:
    attrs = feature.get("attributes", {}) or {}
    geom = feature.get("geometry", {}) or {}

    row = dict(attrs)

    # Prefer LATITUDE/LONGITUDE from attributes if present,
    # otherwise fall back to geometry y/x
    if "LATITUDE" not in row and "y" in geom:
        row["LATITUDE"] = geom["y"]
    if "LONGITUDE" not in row and "x" in geom:
        row["LONGITUDE"] = geom["x"]

    return row