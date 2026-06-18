package com.kags.router.dynamicrouterserver;

public class HeatPoint {

    private final double lat;
    private final double lon;
    private final double radiusMeters;
    private final double severityMultiplier;

    public HeatPoint(double lat, double lon, double radiusMeters, double severityMultiplier) {
        this.lat = lat;
        this.lon = lon;
        this.radiusMeters = radiusMeters;
        this.severityMultiplier = severityMultiplier;
    }

    public HeatPoint(double lat, double lon, double severityMultiplier) {
        this.lat = lat;
        this.lon = lon;
        this.radiusMeters = 100;
        this.severityMultiplier = severityMultiplier;
    }

    public double getLat() { return lat; }
    public double getLon() { return lon; }
    public double getRadiusMeters() { return radiusMeters; }
    public double getSeverityMultiplier() { return severityMultiplier; }
}