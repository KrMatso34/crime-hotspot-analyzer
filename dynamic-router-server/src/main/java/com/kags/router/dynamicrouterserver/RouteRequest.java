package com.kags.router.dynamicrouterserver;

import java.util.List;

public class RouteRequest {
    public double fromLat;
    public double fromLon;
    public double toLat;
    public double toLon;

    // "safest" | "balanced" | "fastest
    public String routePriority;

    // [[lat, lon, severity], [lat, lon, severity], ...]
    public List<List<Double>> heatmapData;

    // [[lat, lon, severity], [lat, lon, severity], ...]
    public List<List<Double>> streetlightData;

    // "car" | "foot"
    public String vehicle;

    /*
        [
            [[lat, lon], [lat, lon], ...], // Polygon 1
            [[lat, lon], [lat, lon], ...], // Polygon 2
            ...
        ]

     */
    public List<List<List<Double>>> riskZones;
}