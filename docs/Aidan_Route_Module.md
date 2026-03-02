# Route Comparison + Directions Module  
Sprint 4 – Backend → React Handoff  
Prepared by: Kyle Matson  

---

## What This Module Does

Backend handles:

- Requesting up to 3 routes from OSRM
- Formatting readable directions
- Scoring routes (fastest / shortest / balanced)
- Generating safe alternate routes if needed
- Returning structured route objects to React

React only renders what the backend returns.

---

# Backend Logic (All Helper Code)

Everything below runs in Python on the backend.

```python
import math


# ===============================
# Distance Formatting
# ===============================

def _format_distance(meters: float) -> str:
    """Convert meters to a readable string."""
    miles = meters / 1609.34
    if miles < 0.1:
        feet = meters * 3.28084
        return f"{feet:.0f} ft"
    return f"{miles:.1f} mi"


def format_instruction(step: dict) -> str:
    """
    Convert raw OSRM step into readable instruction text.
    """
    maneuver = step.get("maneuver", {})
    m_type = maneuver.get("type", "")
    modifier = maneuver.get("modifier", "")
    street = step.get("name", "")
    distance = step.get("distance", 0)

    dist_str = _format_distance(distance)

    if m_type == "turn":
        return f"Turn {modifier} onto {street} for {dist_str}"

    if m_type == "depart":
        return f"Start on {street} for {dist_str}"

    if m_type == "arrive":
        return "Arrive at destination"

    if m_type in ("continue", "new name"):
        return f"Continue on {street} for {dist_str}"

    return f"Continue for {dist_str}"


# ===============================
# Route Scoring
# Lower score = better route
# ===============================

def get_weights(priority: str):
    """
    Returns (time_weight, distance_weight)
    """
    p = (priority or "balanced").lower()

    if p == "fastest":
        return (0.85, 0.15)

    if p == "shortest":
        return (0.35, 0.65)

    return (0.70, 0.30)


def score_route(duration_s: float, distance_m: float, priority: str = "balanced"):
    """
    Calculate route score.
    Lower score = better route.
    """
    time_w, dist_w = get_weights(priority)

    # Convert meters to minute-scale for comparison with seconds
    dist_score = (distance_m / 1609.34) * 60

    return (time_w * duration_s) + (dist_w * dist_score)


# ===============================
# Safe Waypoint Generator
# Used if OSRM returns fewer than 3 routes
# ===============================

def compute_waypoint_safe(from_lat, from_lon, to_lat, to_lon, offset_direction):
    """
    Generate a midpoint waypoint offset north or south.
    Prevents divide-by-zero when points are extremely close.
    """
    mid_lat = (from_lat + to_lat) / 2
    mid_lon = (from_lon + to_lon) / 2

    dx = to_lon - from_lon
    dy = to_lat - from_lat
    dist = math.sqrt(dx * dx + dy * dy)

    if dist < 1e-6:
        nudge = 0.01
        return (mid_lat + (nudge if offset_direction == "north" else -nudge), mid_lon)

    shift = max(0.012, dist * 0.25)

    perp_x = -dy / dist
    perp_y = dx / dist

    if offset_direction == "north":
        wp_lat = mid_lat + perp_y * shift
        wp_lon = mid_lon + perp_x * shift
    else:
        wp_lat = mid_lat - perp_y * shift
        wp_lon = mid_lon - perp_x * shift

    return (wp_lat, wp_lon)



What React Receives From Backend

Backend returns structured route objects like this:{
  "route_index": 0,
  "label": "Direct route",
  "summary": {
    "distance_m": 12345.6,
    "duration_s": 901.2
  },
  "score": 812.4,
  "steps": [
    {
      "i": 0,
      "instruction": "Head north on Main St for 0.2 mi",
      "distance_m": 320.5,
      "duration_s": 40.2
    }
  ],
  "geometry": {
    "type": "LineString",
    "coordinates": [...]
  }
}



Call backend endpoint → receive routes[]

Display route cards (label, duration, distance)

When route selected:
selectedRoute.steps.map(step => step.instruction)
Optional: draw polyline from:
selectedRoute.geometry.coordinates

