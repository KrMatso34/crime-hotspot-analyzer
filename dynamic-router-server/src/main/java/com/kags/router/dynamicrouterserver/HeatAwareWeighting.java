package com.kags.router.dynamicrouterserver;

import com.graphhopper.routing.weighting.Weighting;
import com.graphhopper.util.DistanceCalcEarth;
import com.graphhopper.util.EdgeIteratorState;
import com.graphhopper.util.FetchMode;
import com.graphhopper.util.PointList;

import java.util.List;

public class HeatAwareWeighting implements Weighting {

    private final Weighting baseWeighting;
    private final List<HeatPoint> heatPoints;
    private final DistanceCalcEarth distanceCalc = new DistanceCalcEarth();

    public HeatAwareWeighting(Weighting baseWeighting, List<HeatPoint> heatPoints) {
        this.baseWeighting = baseWeighting;
        this.heatPoints = heatPoints;
    }

    @Override
    public double calcMinWeightPerDistance() {
        return baseWeighting.calcMinWeightPerDistance();
    }

    @Override
    public double calcEdgeWeight(EdgeIteratorState edge, boolean reverse) {

        double baseWeight = baseWeighting.calcEdgeWeight(edge, reverse);

        if (Double.isInfinite(baseWeight)) {
            return baseWeight;
        }

        PointList towerPoints = edge.fetchWayGeometry(FetchMode.TOWER_ONLY);

        double lat1 = towerPoints.getLat(0);
        double lon1 = towerPoints.getLon(0);

        double lat2 = towerPoints.getLat(towerPoints.size() - 1);
        double lon2 = towerPoints.getLon(towerPoints.size() - 1);

        double lat = (lat1 + lat2) / 2.0;
        double lon = (lon1 + lon2) / 2.0;

        double safetyMultiplier = 1.0;

        for (HeatPoint hp : heatPoints) {
            double distance = distanceCalc.calcDist(
                    lat, lon,
                    hp.getLat(), hp.getLon()
            );

            if (distance <= hp.getRadiusMeters()) {
                safetyMultiplier *= hp.getSeverityMultiplier();
            }
        }

        return baseWeight * safetyMultiplier;
    }

    @Override
    public long calcEdgeMillis(EdgeIteratorState edge, boolean reverse) {
        return baseWeighting.calcEdgeMillis(edge, reverse);
    }

    @Override
    public double calcTurnWeight(int inEdge, int viaNode, int outEdge) {
        return baseWeighting.calcTurnWeight(inEdge, viaNode, outEdge);
    }

    @Override
    public long calcTurnMillis(int inEdge, int viaNode, int outEdge) {
        return baseWeighting.calcTurnMillis(inEdge, viaNode, outEdge);
    }

    @Override
    public boolean hasTurnCosts() {
        return baseWeighting.hasTurnCosts();
    }

    @Override
    public String getName() {
        return "heat_aware_weighting";
    }
}