package com.kags.router.dynamicrouterserver;

import com.graphhopper.GraphHopper;
import com.graphhopper.config.Profile;
import com.graphhopper.util.CustomModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.graphhopper.json.Statement.If;
import static com.graphhopper.json.Statement.Op.LIMIT;
import static com.graphhopper.json.Statement.Op.MULTIPLY;

import java.util.Collections;

@Configuration
public class GraphHopperConfig {

    @Bean
    public GraphHopper graphHopper() {

        GraphHopper hopper = new GraphHopper();

        hopper.setOSMFile("src/washington-260228.osm.pbf");
        hopper.setGraphHopperLocation("graph-cache");

        // Which data layers to extract from OSM
        hopper.setEncodedValuesString("car_access, car_average_speed, foot_access, foot_average_speed, road_class, surface");

        CustomModel carModel = new CustomModel();
        carModel.addToPriority(If("!car_access", MULTIPLY, "0"));
        carModel.addToSpeed(If("true", LIMIT, "car_average_speed"));

        Profile carProfile = new Profile("car")
                .setWeighting("custom")
                .setCustomModel(carModel);

        CustomModel footModel = new CustomModel();

        footModel.addToPriority(If("!foot_access", MULTIPLY, "0"));
        footModel.addToSpeed(If("true", LIMIT, "foot_average_speed"));

        Profile footProfile = new Profile("foot")
                .setWeighting("custom")
                .setCustomModel(footModel);

        hopper.setProfiles(carProfile, footProfile);

        // Disable CH for dynamic routing support
        hopper.getCHPreparationHandler().setCHProfiles(Collections.emptyList());

        hopper.importOrLoad();

        System.out.println("GraphHopper initialized!");

        return hopper;
    }
}