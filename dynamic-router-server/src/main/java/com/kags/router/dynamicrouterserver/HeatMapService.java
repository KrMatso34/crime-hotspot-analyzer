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

    private final List<HeatPoint> heatPoints = List.of(
            new HeatPoint(47.6144, -122.1923, 200, 10),
            new HeatPoint(47.6186, -122.1950, 190, 12),
            new HeatPoint(47.6286, -122.1950, 200, 10),
            new HeatPoint(47.6140, -122.1961, 220, 15),
            new HeatPoint(47.6211, -122.2000, 250, 15),
            new HeatPoint(47.6120, -122.2030, 150, 15),
            new HeatPoint(47.6105, -122.1818, 200, 17),
            new HeatPoint(47.6258, -122.1920, 150, 20),
            new HeatPoint(47.6160, -122.2000, 180, 20),
            new HeatPoint(47.6263, -122.1888, 150, 20)
    );

    public List<HeatPoint> getHeatPoints() {
        return heatPoints;
    }

    public void adjustModel(CustomModel model) {
        int count = 0;
        for (HeatPoint hp : heatPoints) {
            String areaId = "heat_zone_" + count++;

            JsonFeature feature = new JsonFeature();
            feature.setId(areaId);

            feature.setGeometry(createArea(hp.getLat(), hp.getLon(), 0.001));

            model.getAreas().getFeatures().add(feature);

            model.addToPriority(If("in_" + areaId, MULTIPLY, "0.1"));
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