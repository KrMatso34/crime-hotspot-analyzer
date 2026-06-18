package com.kags.router.dynamicrouterserver;

import java.util.List;

public class Polygon {

    List<List<Double>> points;
    public Polygon(List<List<Double>> points) {
        this.points = points;
    }

    public int size() {
        return points.size();
    }

    public List<Double> get(int index) {
        return points.get(index);
    }

    public Double getLat(int index) {return points.get(index).get(0);}
    public Double getLon(int index) {return points.get(index).get(1);}

    public String toString() {
        String res = "[";
        int len = size();
        for (int i = 0; i < len; i ++) {
            res += "(" + getLat(i) + ", " + getLon(i) + ")";

            if (i != len-1) {
                res += ", ";
            }
        }
        res += "]";
        return res;
    }
}
