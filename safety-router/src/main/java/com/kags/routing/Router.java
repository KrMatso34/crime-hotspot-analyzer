package com.kags.routing;

import com.graphhopper.GraphHopper;
import com.graphhopper.ResponsePath;
import com.graphhopper.GHRequest;
import com.graphhopper.GHResponse;
import com.graphhopper.config.Profile;
import com.graphhopper.util.CustomModel;
import com.graphhopper.json.Statement;
import static com.graphhopper.json.Statement.If;
import static com.graphhopper.json.Statement.Op.MULTIPLY;
import static com.graphhopper.json.Statement.Op.LIMIT;

import java.util.List;

public class Router {
    public static void printRouteData(double fromLat, double fromLng, double toLat, double toLng) {
        GraphHopper hopper = new GraphHopper();

        hopper.setOSMFile("washington-260228.osm.pbf");
        hopper.setGraphHopperLocation("graph-cache");


        CustomModel model = new CustomModel();

        model.addToSpeed(If("true", LIMIT,"100"));

        hopper.setProfiles(
            new Profile("car") // car, bike
                .setWeighting("custom") // fastest, shortest
                    .setCustomModel(model)

        );

        hopper.importOrLoad();

        GHRequest request = new GHRequest(
                fromLat, fromLng,
                toLat, toLng
        ).setProfile("car");

        GHResponse response = hopper.route(request);

        if (response.hasErrors()) {
            System.out.println(response.getErrors());
            return;
        }

        ResponsePath path = response.getBest();

        System.out.println("Distance: " + path.getDistance() + " meters");
        System.out.println("Time: " + path.getTime() / 1000 + " seconds");
        System.out.println("Geometry points: " + path.getPoints().size());
    }
}
