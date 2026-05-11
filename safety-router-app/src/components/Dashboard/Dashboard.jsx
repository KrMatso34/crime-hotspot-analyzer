import React, { useState, createContext, useEffect } from 'react';

import Header from './components/Header/Header';
import Map from './components/Map/Map';
import QuickRouteSelectPanel from './components/QuickRouteSelectPanel/QuickRouteSelectPanel';
import RouteSelectorPanel from './components/RouteSelectorPanel/RouteSelectorPanel';
import StartNavigationPanel from './components/StartNavigationPanel/StartNavigationPanel';
import { CrimeLegend } from './components/CrimeLegend/CrimeLegend'
import { NotificationCard } from './components/Notifications/NotificationCard'

import styles from './Dashboard.module.css';
import clsx from 'clsx';

import riskZonesData from './riskZonesData.json';

export default function Dashboard() {
	const [camCoords, setCamCoords] = useState([47.610138, -122.201517]);
	const [markerInfo, setMarkerInfo] = useState({});
	const [route, setRoute] = useState([]);
	const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
	const [heatMapRaw, setHeatMapRaw] = useState([]);
	const [heatMap, setHeatMap] = useState([]);
	const [heatMapFilters, setHeatMapFilters] = useState({
		timePeriod: 90,
		ignoreTags: []
	})
	const [riskZones, setRiskZones] = useState(riskZonesData.features.map(f => ({...f, active: true})));
	const [streetlightData, setStreetlightData] = useState([[47.693182, -122.098657], [47.692854, -122.104909], [47.692954, -122.115051], [47.693142, -122.125091], [47.697406, -122.128552]])
	const [streetlightOverride, setStreetlightOverride] = useState(false);
	const [geolocation, setGeoLocation] = useState([]);
	const [mapFocusPoint, setMapFocusPoint] = useState([]);

	useEffect(() => {
		fetchHeatData();
	}, []);

	

	async function fetchHeatData() {
		try {
			const res = await fetch("http://localhost:4000/api/data/");
			const data = await res.json();

			const tags = {};
			for (const entry of data) {
				const key = entry[3] ?? 'ALL OTHER';
				if (tags[key]) {
					tags[key] ++
				} else {
					tags[key] = 1;
				}
			}
			const formattedTags = Object.keys(tags).map((tag) => ({name: tag, count: tags[tag], active: false}));
			setHeatMapFilters((prev) => ({...prev, ignoreTags: formattedTags}));

			setHeatMapRaw(data);
		} catch (err) {
			console.error("Failed to fetch incident data points", err);
		}
	}

	const checkDateRecency = (dateString, dayWindow) => {
		const targetDate = new Date(dateString).getTime();
		const now = new Date().getTime();
		
		const dayWindowMS = dayWindow * 24 * 60 * 60 * 1000; // in milliseconds
		
		const difference = now - targetDate;

		return difference >= 0 && difference <= dayWindowMS;
	}

	useEffect(() => {
		const filteredHeatMap = heatMapRaw.filter((hp) => {
			const hpTag = hp[3];
			const hpTime = hp[4];

			if (!checkDateRecency(hpTime, heatMapFilters.timePeriod)) return false;

			for (const tag of heatMapFilters.ignoreTags) {
				if (hpTag == tag.name && !tag.active) {
					return false;
				}
			}

			
			return true;
		})

		setHeatMap(filteredHeatMap);

	}, [heatMapFilters, heatMapRaw])

	const finishRoute = () => {
		setRoute([]);
		setSelectedRouteIndex(0);
	}

	const setFilterTimePeriod = (timePeriod) => {
		setHeatMapFilters((prev) => ({...prev, timePeriod}))
	}

	const setFilterIgnoreTag = (tagIndex, newState=undefined) => {
		setHeatMapFilters((prev) => ({
			...prev,
			ignoreTags: prev.ignoreTags.map((tag, index) => 
				index === tagIndex 
					? { ...tag, active: (newState!=undefined) ? newState : !tag.active } 
					: tag
			)
		}));
	}

	const toggleRiskZone = (zoneIndex) => {
		setRiskZones((prev) => {
			const next = [...prev];
			next[zoneIndex] = {...next[zoneIndex], active: !next[zoneIndex].active}
			return next;
		});
	}



	return (<>
		<NotificationCard/>
		<div className={clsx(styles.dashboard)} id="dashboard" data-heatmap-loaded={heatMapRaw.length > 0 ? "true" : "false"}>
			<Header/>
			<div className={clsx(styles.content)}>
				<RouteSelectorPanel 
					setCamCoords={(coords, info) => {setCamCoords(coords); setMarkerInfo(info)}}
					route={route} setRoute={setRoute}
					routeInstructions={route.length > 0 ? route[selectedRouteIndex].instructions : []}
					selectedRouteIndex={selectedRouteIndex}
					heatMap={heatMap}
					riskZones={riskZones}
					setStreetlightData={setStreetlightData}
					finishRoute={finishRoute}

					heatMapFilters={heatMapFilters}
					setFilterTimePeriod={setFilterTimePeriod}
					setFilterIgnoreTag={setFilterIgnoreTag}
					toggleRiskZone={toggleRiskZone}
					streetlightOverride={streetlightOverride}
					setStreetlightOverride={setStreetlightOverride}
					geolocation={geolocation}
					mapFocusPoint={mapFocusPoint}
				/>
				
				<Map 
					center={camCoords} 
					markerInfo={markerInfo} 
					routeCoords={route.map(r => ({points: r.points, label: r.label}))}
					heatData={heatMap.map(point => [point[0], point[1], point[2]])}
					selectedRouteIndex={selectedRouteIndex}
					riskZones={riskZones.filter((zone) => zone.active)}
					streetlightData={streetlightOverride ? streetlightData : []}
					setGeoLocation={setGeoLocation}
					setMapFocusPoint={setMapFocusPoint}
					mapFocusPoint={mapFocusPoint}
				/>
				<QuickRouteSelectPanel
					routesInfo={route}
					selectedIndex={selectedRouteIndex}
					setSelectedIndex={setSelectedRouteIndex}
				/>
				<StartNavigationPanel/>

				<CrimeLegend 
					
				/>
			</div>
		</div>
	</>)
}
