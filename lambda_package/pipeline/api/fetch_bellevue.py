import requests
import time

BASE_URL = (
    "https://services1.arcgis.com/EYzEZbDhXZjURPbP/"
    "ArcGIS/rest/services/Offenses/FeatureServer/1/query"
)

PAGE_SIZE = 2000
OUT_SR = 4326


def fetch_bellevue(limit=100, since=None):
    all_features = []
    offset = 0

    while True:
        remaining = limit - len(all_features)
        if remaining <= 0:
            break

        batch_size = min(PAGE_SIZE, remaining)

        where_clause = "1=1"
        if since:
            where_clause = f"REPORT_DATE > {since}"

        params = {
            "where": where_clause,
            "outFields": "*",
            "returnGeometry": "true",
            "outSR": OUT_SR,
            "f": "pjson",
            "orderByFields": "REPORT_DATE DESC",
            "resultRecordCount": batch_size,
            "resultOffset": offset
        }

        r = requests.get(BASE_URL, params=params, timeout=60)
        r.raise_for_status()
        data = r.json()

        features = data.get("features", [])
        if not features:
            break

        all_features.extend(features)
        offset += len(features)
        time.sleep(0.1)

    return all_features