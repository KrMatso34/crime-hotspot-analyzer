from fastapi import FastAPI
import osmnx as ox

app = FastAPI(
    title="Crime Hotspot Analyzer API",
    description="API for analyzing crime hotspots",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"message": "Crime Hotspot Analyzer API is running"}

@app.get("/get-graph")
def get_graph(city: str = "Test City"):
    """
    Returns fake/simplified graph data for testing
    """
    return {
        "nodes": 159,
        "edges": 323,
        "city": city,
        "message": "This is fake data. Real OSMnx integration is in /graph/{city}"
    }

# ────────────────────────────────────────────────
# Add this new endpoint here
# ────────────────────────────────────────────────

@app.get("/graph/{city}")
def get_real_graph(city: str):
    """
    Fetches real street network data for a city using OSMnx.
    Example: http://127.0.0.1:8000/graph/Chicago, Illinois
    """
    try:
        # Download the drive network for the given city
        G = ox.graph_from_place(city, network_type="drive")
        
        # Get basic statistics
        stats = ox.basic_stats(G)
        
        return {
            "city": city,
            "nodes": stats["n"],
            "edges": stats["m"],
            "street_length_total_m": round(stats["street_length_total"], 2),
            "circuity_avg": round(stats["circuity_avg"], 3),
            "message": "Real street network data from OpenStreetMap via OSMnx"
        }
    except Exception as e:
        return {"error": str(e)}

# Optional: run the server (you can also run from terminal)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)