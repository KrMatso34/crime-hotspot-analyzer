import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import Leaflet from "leaflet";
import "leaflet.heat";

// Enhanced heatmap options with better visual definition
const heatmapOptions = {
	blur: 20,
	maxZoom: 18,
	radius: 40,
	gradient: {
		0.0: "#3178c6",
		0.25: "#00d4ff",
		0.5: "#7cb342",
		0.75: "#ffa000",
		1.0: "#d32f2f"
	},
	minOpacity: 0.4,
	max: 1.0
}


export default function HeatmapPlugin({ points }) {
	
	const map = useMap();

	useEffect(() => {
		if (!points || points.length === 0) return;

		// Create heat layer with optimized rendering
		const heatLayer = Leaflet.heatLayer(points, {
			...heatmapOptions,
			// Dynamic radius based on zoom level for better definition
			radius: 25 + (map.getZoom() - 10) * 2,
		});
		heatLayer.addTo(map);

		// Handle zoom changes for responsive scaling
		const handleZoom = () => {
			const newRadius = 25 + (map.getZoom() - 10) * 2;
			heatLayer.setOptions({ radius: newRadius });
		};

		map.on('zoomend', handleZoom);

		return () => {
			map.removeLayer(heatLayer);
			map.off('zoomend', handleZoom);
		};
	}, [map, points]);

	return null;
}
