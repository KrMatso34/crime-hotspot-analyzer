import React, { useEffect, useState, useRef } from 'react';

import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, Polygon, SVGOverlay, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import RecenterPlugin from './components/RecenterPlugin/RecenterPlugin';
import HeatmapPlugin from './components/HeatmapPlugin/HeatmapPlugin';

import { useTheme } from '../ThemeProvider/ThemeProvider';

import { useRiskHeatmapData, useSpecialPoints } from '../../Dashboard';

import styles from './Map.module.css';
import clsx from 'clsx';

const svgIcon = L.divIcon({
	html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
	className: styles.streetlightIcon,
	iconSize: [24, 24],
	iconAnchor: [12, 12]
});

const blueDotIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const redMarkerIcon = new L.Icon({
	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

function RiskZonePolygon({ positions, zone }) {
	const polygonRef = useRef(null);

	return (
		<Polygon 
			ref={polygonRef}
			positions={positions} 
			pathOptions={{color: 'red', fillColor: 'red'}}
		>
		</Polygon>
	)
	/*
return (
		<Polygon 
			ref={polygonRef}
			positions={positions} 
			pathOptions={{color: 'red', fillColor: 'red'}}
			eventHandlers={{
				click: (e) => {
					L.DomEvent.stopPropagation(e);
					L.DomEvent.preventDefault(e);
					e.originalEvent.preventDefault();
					e.originalEvent.stopPropagation();
					
				},
				contextmenu: (e) => {
					L.DomEvent.stopPropagation(e);
					e.originalEvent.preventDefault();
					if (polygonRef.current) {
						polygonRef.current.openPopup(e.latlng);
					}
				}
			}}
			onContextMenu={(e) => {
				e.preventDefault();
				e.stopPropagation();
				if (polygonRef.current) {
					polygonRef.current.openPopup(e.latlng);
				}
			}}
		>
			<Popup>
				<h3>{zone.properties.name}</h3>
				<p>{zone.properties.notes}</p>
				<p><strong>Risk level</strong>: {zone.properties.riskLevel}</p>
				<p><strong>Primary crime types</strong>: {zone.properties.primaryCrimeTypes.map(t => t.replaceAll('_', ' ')).join(', ')}</p>
			</Popup>
		</Polygon>
	)
	*/
}


export default function Map({ 
	center, 
	markerInfo, 
	routeCoords=[], 
	riskZones=[], 
	streetlightData=[], 
	selectedRouteIndex,
	setGeoLocation,
	setMapFocusPoint,
	mapFocusPoint,
}) {
	const [routeScore, setRouteScore] = useState(0);
	const [routeBoxPosition, setRouteBoxPosition] = useState([]);
	const [deviceLocation, setDeviceLocation] = useState([]);

	const heatmapData = useRiskHeatmapData();
	const heatData = heatmapData.heatMap.map(point => [point[0], point[1], point[2]])

	const { theme } = useTheme();
	const isDarkMode = theme != 'light';
	const { bounds } = useSpecialPoints();

	useEffect(() => {
		if (!navigator || !navigator.geolocation) {
			console.log("Geolocation is not supported by your browser.");
			return;
		}

		const watchId = navigator.geolocation.watchPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				setDeviceLocation([latitude, longitude]);
			},
			(err) => {
				handleLocationError(err);
			},
			{ 
				enableHighAccuracy: true, 
				timeout: 10000,      // Max 10 seconds to wait before falling back/erroring
				maximumAge: 30000    // Accept a cached location up to 30 seconds old
			}
		);

		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	}, []); 
	
	const handleLocationError = (error) => {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				console.log("User denied the request for Geolocation.");
				break;
			case error.POSITION_UNAVAILABLE:
				console.log("Location information is unavailable.");
				break;
			case error.TIMEOUT:
				console.log("The request to get user location timed out.");
				break;
			default:
				console.log("An unknown error occurred.");
				break;
		}
	};

	
	const getLineColor = (label) => {
		if (label === 'safest') {
			return "cyan";
		} else if (label === 'fastest') {
			return "red";
		} else {
			return "lime";
		}
	}

	

	useEffect(() => {
		setGeoLocation(deviceLocation);
	}, [deviceLocation])

	const lightModeUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
	const darkModeUrl = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"; 

	function MapEvents() {
		const map = useMapEvents({
			// contextmenu
			click: (e) => {
				const {lat, lng} = e.latlng;
				setMapFocusPoint([lat, lng])
				L.DomEvent.stopPropagation(e);
				//alert(`You right-clicked the map at: \nLatitude: ${lat} \nLongitude: ${lng}`);
			}
		})
		return null;
	}

	const boundsGeometry = [[bounds[1], bounds[0]], [bounds[1], bounds[2]], [bounds[3], bounds[2]], [bounds[3], bounds[0]]]
	
	const ALLOW_DARK_MAP = import.meta.env.VITE_ALLOW_DARK_MAP;
	
	return (
		<main 
			className={styles.mapContainer} 
		>
			<div id='mapData' data-heatmap-active={heatData.length > 0 ? 'true' : 'false'}/>
			<MapContainer center={center} zoom={13} className={clsx(styles.map)}>
				<TileLayer
					attribution={isDarkMode ? 
						'&copy; <a href="https://stadiamaps.com" target="_blank">Stadia</a> &copy; <a href="https://openmaptiles.org" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : 
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					}
					
					url={isDarkMode && ALLOW_DARK_MAP ? darkModeUrl : lightModeUrl}
				/>

				{
				<Marker position={center}>
					<Popup>
						<h3>{markerInfo.name ?? ''}</h3>
						<p>{markerInfo.display_name ?? ''}</p>
					</Popup>
				</Marker>
				}

				{deviceLocation.length == 2 && 
					<Marker position={deviceLocation} icon={blueDotIcon}>
						<Popup>You are here</Popup>
					</Marker>
				}

				{mapFocusPoint.length == 2 && 
					<Marker position={mapFocusPoint} icon={redMarkerIcon}>
						<Popup>{`${mapFocusPoint[0]}, ${mapFocusPoint[1]}`}</Popup>
					</Marker>
				}

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
					<Polygon
						positions={boundsGeometry}
						pathOptions={{color: 'white', fillOpacity: 0}}
					/>
				}
				
				{
					
					riskZones.map((zone, i) => (
						<RiskZonePolygon 
							positions={zone.geometry.coordinates[0].map(coord => ([coord[1], coord[0]]))}  
							zone={zone} 
							key={i}
						/>
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
				<MapEvents/>
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