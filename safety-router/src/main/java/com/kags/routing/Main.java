package com.kags.routing;



public class Main {
    public static void main(String[] args) {
        Router r = new Router();

        double fromLat = 47.6062;
        double fromLng = -122.3321;
        double toLat = 47.6205;
        double toLng = -122.3493;

        r.printRouteData(fromLat, fromLng, toLat, toLng);

    }
}