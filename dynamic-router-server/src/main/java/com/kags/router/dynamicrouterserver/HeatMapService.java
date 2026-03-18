package com.kags.router.dynamicrouterserver;

import com.graphhopper.util.CustomModel;
import com.graphhopper.util.EdgeIteratorState;
import com.graphhopper.util.JsonFeature;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import static com.graphhopper.json.Statement.If;
import static com.graphhopper.json.Statement.Op.MULTIPLY;



@Service
public class HeatMapService {

    private final List<HeatPoint> heatPoints;

    public List<HeatPoint> getHeatPoints() {
        return heatPoints;
    }

    public HeatMapService(List<HeatPoint> heatPoints) {
        this.heatPoints = heatPoints;
    }

    public void adjustModel(CustomModel model, String routePriority) {
        if (routePriority.equals("fastest")) return;

        double radius = 0.002;
        String multiplier = "0.08";

        if (routePriority.equals("balanced")) {
            radius = 0.001;
            multiplier = "0.8";
        }

        int count = 0;
        for (HeatPoint hp : heatPoints) {
            String areaId = "heat_zone_" + count++;

            JsonFeature feature = new JsonFeature();
            feature.setId(areaId);

            feature.setGeometry(createArea(hp.getLat(), hp.getLon(), radius));

            model.getAreas().getFeatures().add(feature);

            model.addToPriority(If("in_" + areaId, MULTIPLY, multiplier));
        }
    }

    private org.locationtech.jts.geom.Geometry createArea(double lat, double lon, double radius) {
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

}