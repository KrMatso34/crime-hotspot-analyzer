import React, { useState, createContext, useEffect } from 'react';

import Header from './components/Header/Header';
import Map from './components/Map/Map';
import QuickRouteSelectPanel from './components/QuickRouteSelectPanel/QuickRouteSelectPanel';
import RouteSelectorPanel from './components/RouteSelectorPanel/RouteSelectorPanel';
import StartNavigationPanel from './components/StartNavigationPanel/StartNavigationPanel';
import { CrimeLegend } from './components/CrimeLegend/CrimeLegend'

import styles from './Dashboard.module.css';
import clsx from 'clsx';

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

	return (
		<div className={clsx(styles.dashboard)}>
			<Header/>
			<div className={clsx(styles.content)}>
				<RouteSelectorPanel 
					setCamCoords={(coords, info) => {setCamCoords(coords); setMarkerInfo(info)}}
					setRoute={setRoute}
					routeInstructions={route.length > 0 ? route[selectedRouteIndex].instructions : []}
					heatMap={heatMap}
					finishRoute={finishRoute}

					heatMapFilters={heatMapFilters}
					setFilterTimePeriod={setFilterTimePeriod}
					setFilterIgnoreTag={setFilterIgnoreTag}
				/>
				
				<Map 
					center={camCoords} 
					markerInfo={markerInfo} 
					routeCoords={route.map(r => ({points: r.points, label: r.label}))}
					heatData={heatMap.map(point => [point[0], point[1], point[2]])}
					selectedRouteIndex={selectedRouteIndex}
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
	)
}
