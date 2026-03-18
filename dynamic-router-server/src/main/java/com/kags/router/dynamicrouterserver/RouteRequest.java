package com.kags.router.dynamicrouterserver;

import java.util.List;

public class RouteRequest {
    public double fromLat;
    public double fromLon;
    public double toLat;
    public double toLon;

    // "safest" | "balanced" | "fastest
    public String routePriority;

    // This expects the format: [[lat, lon, severity], [lat, lon, severity], ...]
    public List<List<Double>> heatmapData;

    // "car" | "foot"
    public String vehicle;
}