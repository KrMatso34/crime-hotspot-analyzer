import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import Leaflet from "leaflet";
import "leaflet.heat";

// See https://github.com/Leaflet/Leaflet.heat for more styling options
const heatmapOptions = {
	blur: 25,
	maxZoom: 16,
	gradient: {
		0.1: "blue",
		0.4: "lime",
		0.7: "orange",
		1.0: "red"
	},
	minOpacity: 0.6
}


export default function HeatmapPlugin({ points }) {
	
	const map = useMap();

	useEffect(() => {
		if (!points) return;

		const heatLayer = Leaflet.heatLayer(points, heatmapOptions);
		heatLayer.addTo(map);

		return () => {
			map.removeLayer(heatLayer);
		};
	}, [map, points]);

	const getRadius = (zoom) => {
		return zoom * 2; 
	};

	return null;
}
