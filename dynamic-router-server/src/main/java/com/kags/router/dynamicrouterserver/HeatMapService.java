package com.kags.router.dynamicrouterserver;

import com.graphhopper.util.CustomModel;
import com.graphhopper.util.JsonFeature;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.graphhopper.json.Statement.If;
import static com.graphhopper.json.Statement.Op.MULTIPLY;

import java.time.LocalTime;


@Service
public class HeatMapService {

    private final List<HeatPoint> heatPoints;
    private final List<HeatPoint> streetlightPoints;
    private final List<Polygon> riskZones;


    public HeatMapService(List<HeatPoint> heatPoints, List<Polygon> riskZones, List<HeatPoint> streetlightPoints) {
        this.heatPoints = heatPoints;
        this.riskZones = riskZones;
        this.streetlightPoints = streetlightPoints;

    }

    public void adjustModel(CustomModel model, String routePriority) {
        if (routePriority.equals("fastest")) return;

        applyHeatPoints(model, routePriority);
        applyStreetlightPoints(model, routePriority);
        applyRiskZones(model, routePriority);
    }

    private void applyHeatPoints(CustomModel model, String routePriority) {
        double radius = 0.002;
        String multiplier = "0.08";

        if (routePriority.equals("balanced")) {
            radius = 0.001;
            multiplier = "0.8";
        }

        applyHeatPoints(heatPoints, radius, multiplier, "heat_zone_", model);
    }

    private void applyStreetlightPoints(CustomModel model, String routePriority) {
        LocalTime now = LocalTime.now();
        int hour = now.getHour(); // Returns 0-23

        double radius = 0.006;
        String multiplier = "1.0";

        if (hour < 8 || hour > 19) {
            multiplier = "2.0";

            if (routePriority.equals("balanced")) {
                radius = 0.0045;
                multiplier = "1.5";
            }
        }

        System.out.println(multiplier);


        applyHeatPoints(streetlightPoints, radius, multiplier, "street_light_", model);
    }

    private void applyHeatPoints(List<HeatPoint> points, double radius, String multiplier, String idPrefix,
                                 CustomModel model) {
        if (multiplier.equals("1.0")) return;

        int count = 0;
        for (HeatPoint hp : points) {
            String areaId = idPrefix + count++;

            JsonFeature feature = new JsonFeature();
            feature.setId(areaId);

            feature.setGeometry(createAreaCircle(hp.getLat(), hp.getLon(), radius));

            model.getAreas().getFeatures().add(feature);

            model.addToPriority(If("in_" + areaId, MULTIPLY, multiplier));
        }
    }

    private void applyRiskZones(CustomModel model, String routePriority) {
        String multiplier = "0.3";

        if (routePriority.equals("balanced")) {
            multiplier = "0.5";
        }

        int count = 0;
        for (Polygon zone : riskZones) {
            if (zone.size() < 3) continue;

            String areaId = "risk_zone_" + count++;

            JsonFeature feature = new JsonFeature();
            feature.setId(areaId);

            feature.setGeometry(createAreaPolygon(zone));

            model.getAreas().getFeatures().add(feature);

            model.addToPriority(If("in_" + areaId, MULTIPLY, multiplier));
        }
    }

    private org.locationtech.jts.geom.Geometry createAreaCircle(double lat, double lon, double radius) {
        org.locationtech.jts.geom.GeometryFactory factory = new org.locationtech.jts.geom.GeometryFactory();

        org.locationtech.jts.geom.Coordinate[] coords = new org.locationtech.jts.geom.Coordinate[] {
                new org.locationtech.jts.geom.Coordinate(lon - radius, lat - radius),
                new org.locationtech.jts.geom.Coordinate(lon + radius, lat - radius),
                new org.locationtech.jts.geom.Coordinate(lon + radius, lat + radius),
                new org.locationtech.jts.geom.Coordinate(lon - radius, lat + radius),
                new org.locationtech.jts.geom.Coordinate(lon - radius, lat - radius)
        };

        return factory.createPolygon(coords);
    }

    private org.locationtech.jts.geom.Geometry createAreaPolygon(Polygon shape) {
        org.locationtech.jts.geom.GeometryFactory factory = new org.locationtech.jts.geom.GeometryFactory();

        // Create array with one extra slot to close the polygon
        org.locationtech.jts.geom.Coordinate[] coords =
            new org.locationtech.jts.geom.Coordinate[shape.size() + 1];

        for (int i = 0; i < shape.size(); i++) {
            coords[i] = new org.locationtech.jts.geom.Coordinate(shape.getLon(i), shape.getLat(i));
        }

        // Close the polygon by repeating the first point at the end
        coords[shape.size()] = new org.locationtech.jts.geom.Coordinate(
                shape.getLon(0),
                shape.getLat(0)
        );

        return factory.createPolygon(coords);
    }

}