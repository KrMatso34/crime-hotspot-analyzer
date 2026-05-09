import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function RecenterPlugin({ lat, lng }) {
	
	const map = useMap();

	useEffect(() => {
		if (!map) return;
		
		// .flyTo gives smooth animation with better responsiveness
		// duration: 1.5s for smooth transition, padding to avoid overlap with controls
		map.flyTo([lat, lng], map.getZoom(), {
			duration: 1.5,
			easeLinearity: 0.25,
			animate: true
		});
	}, [lat, lng, map]);

	return null;
}
