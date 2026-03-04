import sys
import json
import pickle
import osmnx as ox
import networkx as nx

# Load the graph (fast)
G = pickle.load(open("bellevue_graph.pkl", "rb"))

# Get args from Node.js call
lat1, lon1, lat2, lon2, pref = sys.argv[1:]

try:
    # Find nearest nodes
    orig_node = ox.distance.nearest_nodes(G, float(lon1), float(lat1))
    dest_node = ox.distance.nearest_nodes(G, float(lon2), float(lat2))

    # Choose weight
    weight = "combined_cost" if pref.lower() == "safest" else "travel_time_sec"

    # Compute shortest path
    route_nodes = nx.shortest_path(G, orig_node, dest_node, weight=weight)

    # Convert to Leaflet-friendly [lat, lon] list
    coords = [[G.nodes[n]['y'], G.nodes[n]['x']] for n in route_nodes]

    # Simple stats
    total_dist_m = sum(G[u][v][0].get('length', 0) for u, v in zip(route_nodes, route_nodes[1:]))
    total_time_min = sum(G[u][v][0].get('travel_time_sec', 0) for u, v in zip(route_nodes, route_nodes[1:])) / 60
    avg_risk = sum(G[u][v][0].get('risk_score', 0) for u, v in zip(route_nodes, route_nodes[1:])) / max(1, len(route_nodes)-1)

    print(json.dumps({
        "geometry": coords,
        "distance_mi": round(total_dist_m / 1609.34, 1),
        "duration_min": round(total_time_min),
        "riskAssessment": round(avg_risk, 2)
    }))
except nx.NetworkXNoPath:
    print(json.dumps({"error": "No path found"}))
except Exception as e:
    print(json.dumps({"error": str(e)}))