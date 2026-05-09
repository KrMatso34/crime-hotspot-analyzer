import React, { useState, useEffect } from 'react';

import Header from './components/Header/Header';
import Map from './components/Map/Map';
import RouteSelectorPanel from './components/RouteSelectorPanel/RouteSelectorPanel';
import { fetchCrimeHotspots } from '@services/crimeData';

import styles from './Dashboard.module.css';
import clsx from 'clsx';

export default function Dashboard() {
	const [camCoords, setCamCoords] = useState([47.6101, -122.2015]); // Bellevue, WA (default)
	const [markerInfo, setMarkerInfo] = useState({});
	const [routeCoords, setRouteCoords] = useState([]);
	const [showPanel, setShowPanel] = useState(false);
	const [isLoadingLocation, setIsLoadingLocation] = useState(true);
	const [routeRiskScore, setRouteRiskScore] = useState(null);
	const [crimeHotspots, setCrimeHotspots] = useState([]);

	// Get user's current location on component mount
	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setCamCoords([latitude, longitude]);
					setMarkerInfo({
						name: 'Your Location',
						display_name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
					});
					setIsLoadingLocation(false);
				},
				(error) => {
					console.warn('Geolocation error:', error);
					// Fall back to Bellevue if geolocation fails
					setIsLoadingLocation(false);
				},
				{
					timeout: 10000,
					maximumAge: 0,
					enableHighAccuracy: false
				}
			);
		} else {
			console.warn('Geolocation not supported');
			setIsLoadingLocation(false);
		}
	}, []);

	// Fetch crime hotspots on component mount
	useEffect(() => {
		const loadCrimeData = async () => {
			try {
				const hotspots = await fetchCrimeHotspots();
				console.log('Loaded hotspots:', hotspots);
				if (hotspots && hotspots.length > 0) {
					setCrimeHotspots(hotspots);
				}
			} catch (error) {
				console.error('Failed to load crime data:', error);
				// Continue without crime data - app still works
			}
		};

		loadCrimeData();
	}, []);
	
	return (
		<div className={clsx(styles.dashboard)}>
			{/* Full screen map background */}
			<div className={styles.mapBackground}>
				<Map 
					center={camCoords} 
					markerInfo={markerInfo} 
					routeCoords={routeCoords}
					crimeHotspots={crimeHotspots}
					riskScore={routeRiskScore}
				/>
			</div>

			{/* Header overlay - mobile only */}
			<div className={styles.headerOverlay}>
				<Header/>
			</div>

			{/* Bottom sheet panel */}
			<div className={clsx(styles.bottomSheet, { [styles.expanded]: showPanel })}>
				<div 
					className={styles.bottomSheetHandle}
					onClick={() => setShowPanel(!showPanel)}
					role="button"
					tabIndex={0}
					aria-label="Expand controls panel"
				>
					<div className={styles.handle}></div>
				</div>
				
				<div className={clsx(styles.panelContent)}>
					<RouteSelectorPanel 
						setCamCoords={(coords, info) => {setCamCoords(coords); setMarkerInfo(info)}}
						setRouteCoords={setRouteCoords}
						onClose={() => setShowPanel(false)}
						onRouteRiskUpdate={setRouteRiskScore}
						crimeHotspots={crimeHotspots}
					/>
				</div>
			</div>
		</div>
	);
}
