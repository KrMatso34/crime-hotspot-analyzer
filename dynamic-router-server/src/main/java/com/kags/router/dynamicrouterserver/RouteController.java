package com.kags.router.dynamicrouterserver;

import com.graphhopper.GHRequest;
import com.graphhopper.GHResponse;
import com.graphhopper.GraphHopper;
import com.graphhopper.ResponsePath;
import com.graphhopper.config.Profile;
import com.graphhopper.routing.weighting.Weighting;
import com.graphhopper.util.CustomModel;
import com.graphhopper.util.PMap;
import com.graphhopper.util.shapes.GHPoint;
import com.graphhopper.util.Instruction;
import com.graphhopper.util.InstructionList;
import org.springframework.web.bind.annotation.*;
import static com.graphhopper.json.Statement.If;
import static com.graphhopper.json.Statement.Op.MULTIPLY;


import java.util.*;

@RestController
@RequestMapping("/route")
@CrossOrigin(origins = "http://localhost:5173") // allow access from frontend
public class RouteController {

    private final GraphHopper hopper;
    private final HeatMapService heatMapService;

    public RouteController(GraphHopper hopper) {
        this.hopper = hopper;
        this.heatMapService = new HeatMapService();
    }

    @GetMapping
    public Map<String, Object> route(
            @RequestParam double fromLat,
            @RequestParam double fromLon,
            @RequestParam double toLat,
            @RequestParam double toLon) {

        // Clone the base profile's CustomModel
        CustomModel requestModel = new CustomModel(
                hopper.getProfile("car").getCustomModel()
        );

        // Apply dynamic heat points (very low for testing)
        heatMapService.adjustModel(requestModel);

        // Build GHRequest with temp profile
        GHRequest request = new GHRequest(fromLat, fromLon, toLat, toLon)
                .setProfile("car")
                .setCustomModel(requestModel)
                .setLocale("en");

        GHResponse response = hopper.route(request);

        if (response.hasErrors()) {
            throw new RuntimeException(response.getErrors().toString());
        }

        ResponsePath path = response.getBest();

        Map<String, Object> result = new HashMap<>();
        result.put("distance", path.getDistance());   // in meters
        result.put("time", path.getTime());           // in milliseconds

        // Return coordinates as simple array of [lat, lon]
        List<List<Double>> points = new ArrayList<>();
        for (GHPoint p : path.getPoints()) {
            points.add(Arrays.asList(p.lat, p.lon));
        }
        result.put("points", points);

        // Return instructions safely
        List<Map<String, Object>> instructions = new ArrayList<>();
        InstructionList instrList = path.getInstructions();
        for (Instruction instr : instrList) {
            Map<String, Object> instrMap = new HashMap<>();
            instrMap.put("text", instr.getTurnDescription(hopper.getTranslationMap().getWithFallBack(Locale.forLanguageTag("en"))));
            instrMap.put("distance", instr.getDistance()); // meters
            instrMap.put("time", instr.getTime());         // milliseconds
            instructions.add(instrMap);
        }
        result.put("instructions", instructions);

        return result;
    }
}