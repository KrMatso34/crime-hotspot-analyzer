import React, { useState } from 'react';

import { MapContainer, TileLayer, useMap, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import RecenterPlugin from './components/RecenterPlugin/RecenterPlugin';
import HeatmapPlugin from './components/HeatmapPlugin/HeatmapPlugin';

import styles from './Map.module.css';
import clsx from 'clsx';

const heatData = [
    [47.586006, -122.145894, 0.8],  
    [47.582244, -122.145824, 0.6],
    [47.581568, -122.146522, 1.0],
    [47.586419, -122.140149, 0.7],
    [47.590472, -122.148524, 0.9],
  ];

export default function Header({ center, markerInfo, routeCoords=[] }) {

	return (
		<main className={styles.mapContainer}>
			<MapContainer center={center} zoom={13} className={clsx(styles.map)}>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<Marker position={center}>
					<Popup>
						<h3>{markerInfo.name ?? ''}</h3>
						<p>{markerInfo.display_name ?? ''}</p>
					</Popup>
				</Marker>

				{routeCoords.length > 0 && (
					<Polyline positions={routeCoords} color="blue" />
				)}

				<RecenterPlugin lat={center[0]} lng={center[1]}/>
				<HeatmapPlugin points={heatData}/>
			</MapContainer>
		</main>
	);
}
