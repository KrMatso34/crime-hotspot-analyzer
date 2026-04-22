import React, { useEffect, useState } from 'react';

import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, Polygon, SVGOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import RecenterPlugin from './components/RecenterPlugin/RecenterPlugin';
import HeatmapPlugin from './components/HeatmapPlugin/HeatmapPlugin';

import { scoreRoute } from '@services/geocode';

import styles from './Map.module.css';
import clsx from 'clsx';

const svgIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  className: styles.streetlightIcon,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function Map({ center, markerInfo, routeCoords=[], riskZones=[], streetlightData=[], heatData, selectedRouteIndex }) {
	const [isDarkMode, setIsDarkMode] = useState(true);
	const [routeScore, setRouteScore] = useState(0);
	const [routeBoxPosition, setRouteBoxPosition] = useState([]);

	
	const getLineColor = (label) => {
		if (label === 'safest') {
			return "cyan";
		} else if (label === 'fastest') {
			return "red";
		} else {
			return "lime";
		}
	}

	const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

	const lightModeUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
	const darkModeUrl = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"; 

	return (
		<main className={styles.mapContainer}>
			<MapContainer center={center} zoom={13} className={clsx(styles.map)}>
				<TileLayer
					attribution={isDarkMode ? 
						'&copy; <a href="https://stadiamaps.com" target="_blank">Stadia</a> &copy; <a href="https://openmaptiles.org" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : 
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					}
					url={isDarkMode ? darkModeUrl : lightModeUrl}
				/>

				<Marker position={center}>
					<Popup>
						<h3>{markerInfo.name ?? ''}</h3>
						<p>{markerInfo.display_name ?? ''}</p>
					</Popup>
				</Marker>

				{routeBoxPosition.length > 0 ? <Marker position={routeBoxPosition} interactive={false}>
					<Tooltip
						permanent
						direction="top"
						offset={[0, -10]}
						className={clsx(
							styles.scoreBox,
						)}
					>
					Score: {routeScore}
					</Tooltip>
				</Marker> : ''}

				{
					
					riskZones.map(zone => (
						<Polygon positions={zone.geometry.coordinates[0].map(coord => ([coord[1], coord[0]]))} pathOptions={{color: 'red', fillColor: 'red'}}/>
					))
				}

				{
					streetlightData.map(lightCoord => (
						<Marker position={lightCoord} icon={svgIcon} />
					))
				}

				{
					routeCoords.map((route, index) => {
						const isActive = index === selectedRouteIndex;
						const color = getLineColor(route.label);

						// If it's active, we might want to skip it here 
						// and render it separately at the end to ensure it's on top.
						if (isActive) return null;

						if (!route.points) return null;

						return (
							<Polyline 
								key={index} 
								positions={route.points} 
								color={color} 
								weight={4} 
								opacity={0.6} 
							/>
						);
					})
				}
				{selectedRouteIndex !== null && routeCoords[selectedRouteIndex] && routeCoords[selectedRouteIndex].points && (
					<>
						<Polyline 
							positions={routeCoords[selectedRouteIndex].points} 
							pathOptions={{
								color: 'black', 
								weight: 10,
								opacity: 0.5,
								lineJoin: 'round'
							}}
						/>
						<Polyline 
							positions={routeCoords[selectedRouteIndex].points} 
							pathOptions={{
								color: getLineColor(routeCoords[selectedRouteIndex].label),
								weight: 6,
								opacity: 1,
								lineJoin: 'round'
							}}
						/>
					</>
				)}
				
				

				<RecenterPlugin lat={center[0]} lng={center[1]}/>
				<HeatmapPlugin points={heatData}/>
			</MapContainer>
		</main>
	);
}


/*
	useEffect(() => {
		if (routeCoords.length == 0) return;

		setRouteScore(scoreRoute(routeCoords, heatData));

		// Pick a point along the polyline to attach the box
		const middlePointIndex = Math.floor(routeCoords.length / 2);
		const middlePoint = routeCoords[middlePointIndex];

		// Slight offset in lat/lng to avoid overlaying the line
		const offsetLat = 0.0001; // ~10m north
		const offsetLng = 0.0001; // ~10m east
		const boxPosition = [
			middlePoint[0] + offsetLat,
			middlePoint[1] + offsetLng,
		];
		setRouteBoxPosition(boxPosition);
	}, [routeCoords]);
	*/