import React, { useEffect, useState } from 'react';

import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import RecenterPlugin from './components/RecenterPlugin/RecenterPlugin';
import HeatmapPlugin from './components/HeatmapPlugin/HeatmapPlugin';

import { scoreRoute } from '@services/geocode';

import styles from './Map.module.css';
import clsx from 'clsx';

export default function Header({ center, markerInfo, routeCoords=[] }) {
	const [isDarkMode, setIsDarkMode] = useState(true);
	const [heatData, setHeatData] = useState([]);
	const [routeScore, setRouteScore] = useState(0);
	const [routeBoxPosition, setRouteBoxPosition] = useState([]);

	useEffect(() => {
		fetchHeatData();
	}, []);

	async function fetchHeatData() {
		try {
			const res = await fetch("http://localhost:4000/api/navigation/incidentData");
			const data = await res.json();

			setHeatData(data.data);
		} catch (err) {
			console.error("Failed to fetch incident data points", err);
		}
	}

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

				{routeCoords.length > 0 && (
					<Polyline positions={routeCoords} color="blue" />
				)}

				<RecenterPlugin lat={center[0]} lng={center[1]}/>
				<HeatmapPlugin points={heatData}/>
			</MapContainer>
		</main>
	);
}
