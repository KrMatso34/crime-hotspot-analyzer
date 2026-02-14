import React, { useState } from 'react';

import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import RecenterPlugin from './components/RecenterPlugin/RecenterPlugin';

import styles from './Map.module.css';
import clsx from 'clsx';

export default function Header({ center, markerInfo }) {


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
				<RecenterPlugin lat={center[0]} lng={center[1]}/>
			</MapContainer>
		</main>
	);
}
