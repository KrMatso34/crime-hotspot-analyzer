import requests

SEATTLE_URL = "https://data.seattle.gov/resource/tazs-3rd5.json"

def fetch_seattle(limit=100, since=None):
    params = {
        "$limit": limit,
        "$order": "report_date_time DESC"
    }

    if since:
        params["$where"] = f"report_date_time > '{since}'"

    r = requests.get(SEATTLE_URL, params=params, timeout=60)
    r.raise_for_status()
    return r.json()