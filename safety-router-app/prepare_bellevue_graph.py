import osmnx as ox
import networkx as nx
from shapely.geometry import LineString, Point
from shapely.ops import transform
from pymongo import MongoClient
from tqdm import tqdm
import pickle
import pyproj

# ====================== CONFIG ======================
PLACE = "Bellevue, Washington, USA"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "kagsdb"
COLLECTION = "crimes"          # CHANGE THIS if your collection has a different name!
BUFFER_METERS = 75             # Risk buffer around each street edge

print("Step 1: Downloading Bellevue roads (respects one-way & no-left-turn signs)...")
G = ox.graph_from_place(PLACE, network_type="drive", simplify=True)

print("Step 2: Adding travel times...")
for u, v, k, data in tqdm(G.edges(keys=True, data=True)):
    length_m = data["length"]
    
    maxspeed_raw = data.get("maxspeed", 40)
    
    # Handle list case (OSM can store multiple speeds)
    if isinstance(maxspeed_raw, list):
        maxspeed_raw = maxspeed_raw[0] if maxspeed_raw else 40
    
    # Convert to float safely
    if isinstance(maxspeed_raw, (int, float)):
        speed_kph = float(maxspeed_raw)
    elif isinstance(maxspeed_raw, str):
        try:
            # Take first numeric part (handles '60 mph', '50 km/h', '30')
            cleaned = ''.join(c for c in maxspeed_raw.split()[0] if c.isdigit() or c == '.')
            speed_kph = float(cleaned) if cleaned else 40
        except (ValueError, IndexError):
            speed_kph = 40
    else:
        speed_kph = 40
    
    data["travel_time_sec"] = length_m / (speed_kph * 1000 / 3600)

print("Projecting graph to UTM for accurate buffering...")
G_proj = ox.project_graph(G, to_crs="EPSG:32610")

print("Step 3: Adding danger score from crimes...")
client = MongoClient(MONGO_URI)
col = client[DB_NAME][COLLECTION]

for u, v, k, data in tqdm(G_proj.edges(keys=True, data=True)):
    # Edge geometry in projected space
    edge_geom = data.get("geometry") or LineString([
        Point(G_proj.nodes[u]["x"], G_proj.nodes[u]["y"]),
        Point(G_proj.nodes[v]["x"], G_proj.nodes[v]["y"])
    ])
    
    buffer_proj = edge_geom.buffer(BUFFER_METERS)
    
    # Convert buffer polygon to WGS84 (lng, lat) for MongoDB
    project_to_wgs84 = pyproj.Transformer.from_crs("EPSG:32610", "EPSG:4326", always_xy=True).transform
    buffer_wgs84 = transform(project_to_wgs84, buffer_proj)
    
    coords = list(buffer_wgs84.exterior.coords)
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    
    count = col.count_documents({
        "location": {
            "$geoWithin": {
                "$geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            }
        }
    })
    
    data["crime_count"] = count
    data["risk_score"] = count ** 0.5  # square root smooths extremes

print("Projecting back to WGS84...")
G = ox.project_graph(G_proj)

print("Step 4: Combining time + risk into combined cost...")
for u, v, k, data in G.edges(keys=True, data=True):
    data["combined_cost"] = data["travel_time_sec"] + 8 * data.get("risk_score", 0)

print("Saving graph...")
ox.save_graphml(G, "bellevue_graph_with_risk.graphml")
with open("bellevue_graph.pkl", "wb") as f:
    pickle.dump(G, f)

print("FINISHED!")
print(f"Edges: {G.number_of_edges():,}")
print(f"Nodes: {G.number_of_nodes():,}")