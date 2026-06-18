import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function RecenterPlugin({ lat, lng }) {
	
	const map = useMap();

	useEffect(() => {
		// .flyTo gives smooth animation; .setView is instant
		map.flyTo([lat, lng], map.getZoom());
	}, [lat, lng, map]);

	return null;
}
