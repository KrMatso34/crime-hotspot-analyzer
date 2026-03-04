package com.kags.router.dynamicrouterserver;

import com.graphhopper.GraphHopper;
import com.graphhopper.config.Profile;
import com.graphhopper.util.CustomModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.Map;
import static com.graphhopper.json.Statement.If;
import static com.graphhopper.json.Statement.Op.LIMIT;
import static com.graphhopper.json.Statement.Op.MULTIPLY;

@Configuration
public class GraphHopperConfig {

    @Bean
    public GraphHopper graphHopper() {

        GraphHopper hopper = new GraphHopper();

        hopper.setOSMFile("washington-260228.osm.pbf");
        hopper.setGraphHopperLocation("graph-cache");

        // Base CustomModel
        CustomModel baseModel = new CustomModel();
        //baseModel.addToSpeed(If("true", MULTIPLY, "1"));
        baseModel.addToSpeed(If("true", LIMIT,"100"));

        // Base "car" profile
        hopper.setProfiles(
                new Profile("car")
                        .setCustomModel(baseModel)
        );

        hopper.importOrLoad();

        System.out.println("GraphHopper initialized!");

        return hopper;
    }
}