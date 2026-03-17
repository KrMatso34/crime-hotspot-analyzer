import requests

KING_URL = "https://data.kingcounty.gov/resource/4kmt-kfqf.json"

def fetch_kingcounty(limit=1000):
    params = {
        "$limit": limit
    }
    r = requests.get(KING_URL, params=params, timeout=60)
    r.raise_for_status()
    return r.json()