package com.kags.router.dynamicrouterserver;

import com.graphhopper.GHRequest;
import com.graphhopper.GHResponse;
import com.graphhopper.GraphHopper;
import com.graphhopper.ResponsePath;
import com.graphhopper.util.CustomModel;
import com.graphhopper.util.shapes.GHPoint;
import com.graphhopper.util.Instruction;
import com.graphhopper.util.InstructionList;
import org.locationtech.jts.util.Stopwatch;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/route")
@CrossOrigin(origins = {"http://localhost:5173", "https://staging.d2nnoacaofd8et.amplifyapp.com"}) // allow access from frontend
public class RouteController {

    private final GraphHopper hopper;

    public RouteController(GraphHopper hopper) {
        this.hopper = hopper;
    }

    @PostMapping
    public Map<String, Object> route(@RequestBody RouteRequest request) {
        Stopwatch stopwatch = new Stopwatch();
        stopwatch.start();

        String profileName = (request.vehicle != null && request.vehicle.equals("foot")) ? "foot" : "car";

        CustomModel requestModel = new CustomModel(
                hopper.getProfile(profileName).getCustomModel()
        );

        List<HeatPoint> heatPoints = request.heatmapData.stream()
                .map(p -> new HeatPoint(p.get(0), p.get(1), p.get(2)))
                .toList();


        List<HeatPoint> streetlightPoints = request.streetlightData.stream()
                .map(p -> new HeatPoint(p.get(0), p.get(1), 1.0))
                .toList();

        List<Polygon> riskZones = request.riskZones.stream()
            .map(z -> new Polygon(z))
            .toList();

        HeatMapService heatMapService = new HeatMapService(heatPoints, riskZones, streetlightPoints);
        heatMapService.adjustModel(requestModel, request.routePriority);

        GHRequest ghRequest = new GHRequest(request.fromLat, request.fromLon, request.toLat, request.toLon)
            .setProfile(profileName)
            .setCustomModel(requestModel)
            .setLocale("en");

        GHResponse response = hopper.route(ghRequest);

        if (response.hasErrors()) {
            throw new RuntimeException(response.getErrors().toString());
        }

        ResponsePath path = response.getBest();

        Map<String, Object> result = new HashMap<>();
        result.put("distance", path.getDistance());   // in meters
        result.put("time", path.getTime());           // in milliseconds

        List<List<Double>> points = new ArrayList<>();
        for (GHPoint p : path.getPoints()) {
            points.add(Arrays.asList(p.lat, p.lon));
        }
        result.put("points", points);

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
        result.put("label", request.routePriority);
        result.put("vehicle", profileName);

        stopwatch.stop();
        System.out.println("Request (" + request.routePriority + ") took " + stopwatch.getTimeString() + " to run.");

        return result;
    }
}