import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-overrides.css';

import RecenterPlugin from './components/RecenterPlugin/RecenterPlugin';
import RiskVisualizationLayer from './components/RiskVisualizationLayer/RiskVisualizationLayer';
// import HeatmapPlugin from './components/HeatmapPlugin/HeatmapPlugin';

import styles from './Map.module.css';
import clsx from 'clsx';

const heatData = [
    [47.586006, -122.145894, 0.8],  
    [47.582244, -122.145824, 0.6],
    [47.581568, -122.146522, 1.0],
    [47.586419, -122.140149, 0.7],
    [47.590472, -122.148524, 0.9],
];

// Create custom markers with better visual definition
const createCustomMarker = (color, size = 32) => {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));"><circle cx="12" cy="8" r="6" fill="${color}" stroke="white" stroke-width="2"/><path d="M 12 14 L 7 24 L 12 20 L 17 24 Z" fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    
    return L.divIcon({
        html: svgIcon,
        iconSize: [size, size + 8],
        iconAnchor: [size / 2, size + 8],
        popupAnchor: [0, -(size + 8)],
        className: 'custom-marker-icon',
    });
};

const startMarker = createCustomMarker('#007AFF', 32);
const destMarker = createCustomMarker('#FF3B30', 32);

export default function Map({ center, markerInfo, routeCoords = [], crimeHotspots = [], riskScore = null }) {
    // Memoize tile layer URLs for better performance
    const tileLayerUrl = useMemo(() => {
        // Detect retina/high-DPI displays
        const isRetina = window.devicePixelRatio > 1;
        return isRetina 
            ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }, []);

    return (
        <main className={styles.mapContainer}>
            <MapContainer 
                center={center} 
                zoom={13} 
                className={clsx(styles.map)}
                zoomControl={true}
                dragging={true}
                touchZoom={true}
                doubleClickZoom={true}
                wheelPxPerZoomLevel={60}
                minZoom={10}
                maxZoom={18}
            >
                {/* High-definition tile layer with better zoom */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
                    url={tileLayerUrl}
                    maxZoom={19}
                    maxNativeZoom={18}
                    crossOrigin={true}
                    noWrap={false}
                />

                {/* Start location marker */}
                <Marker position={center} icon={startMarker}>
                    <Popup>
                        <div className={styles.popupContent}>
                            <h3>{markerInfo.name ?? 'Start Location'}</h3>
                            {markerInfo.display_name && <p>{markerInfo.display_name}</p>}
                        </div>
                    </Popup>
                </Marker>

                {/* Destination marker */}
                {routeCoords.length > 1 && (
                    <Marker position={routeCoords[routeCoords.length - 1]} icon={destMarker}>
                        <Popup>
                            <div className={styles.popupContent}>
                                <h3>Destination</h3>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Route polyline */}
                {routeCoords.length > 0 && (
                    <Polyline 
                        positions={routeCoords} 
                        color="#007AFF" 
                        weight={4}
                        opacity={0.8}
                        dashArray="5, 5"
                        lineCap="round"
                        lineJoin="round"
                    />
                )}

                <RecenterPlugin lat={center[0]} lng={center[1]}/>
                
                {/* Risk visualization: hotspots and route risk overlay */}
                <RiskVisualizationLayer 
                  routeCoordinates={routeCoords}
                  crimeHotspots={crimeHotspots}
                  riskScore={riskScore || 0}
                  visible={routeCoords.length > 0 || crimeHotspots.length > 0}
                />
                
                {/* <HeatmapPlugin points={heatData}/> */}
            </MapContainer>
        </main>
    );
}
