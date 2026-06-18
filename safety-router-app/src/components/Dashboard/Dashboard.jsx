import React, { useState, createContext, useEffect, useContext } from 'react';

import Header from './components/Header/Header';
import Map from './components/Map/Map';
import QuickRouteSelectPanel from './components/QuickRouteSelectPanel/QuickRouteSelectPanel';
import RouteSelectorPanel from './components/RouteSelectorPanel/RouteSelectorPanel';
import StartNavigationPanel from './components/StartNavigationPanel/StartNavigationPanel';
import { CrimeLegend } from './components/CrimeLegend/CrimeLegend'
import { NotificationCard } from './components/Notifications/NotificationCard'
import { ForecastController } from './components/ForecastController/ForecastController';
import { ThemeProvider } from './components/ThemeProvider/ThemeProvider';

import styles from './Dashboard.module.css';
import clsx from 'clsx';

import riskZonesData from './riskZonesData.json';

export const AccessOverridesContext = createContext({});

const SpecialPointsContext = createContext({});
export const useSpecialPoints = () => useContext(SpecialPointsContext);


const AccountInfoContext = createContext({});
export const useAccountInfo = () => useContext(AccountInfoContext);
function AccountInfoContextProvider({children}) {
	const [savedAddress, setSavedAddress] = useState('');
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [id, setId] = useState(null);

	const clear = () => {
		setSavedAddress('');
	}

	const logIn = (id) => {
		setIsLoggedIn(true);
		setId(id)
	};
	const logOut = () => {
		setIsLoggedIn(false);
		clear();
	}

	return <>
		<AccountInfoContext.Provider 
			value={{
				savedAddress, setSavedAddress,
				isLoggedIn, logIn, logOut,
				id
			}}
		>
			{children}
		</AccountInfoContext.Provider>
	</>
}

const RiskDataContext = createContext({});
export const useRiskHeatmapData = () => useContext(RiskDataContext);
function RiskDataContextProvider({children}) {
	const [heatMapRaw, setHeatMapRaw] = useState([]);
	const [heatMap, setHeatMap] = useState([]);
	const [heatMapFilters, setHeatMapFilters] = useState({
		timePeriod: 90,
		ignoreTags: []
	});
	const [scheduledDate, setScheduledDate] = useState('');
	const [forecastReport, setForecastReport] = useState({});
	const forecastActive = true;
	
	// Fetch AWS data on startup
	useEffect(() => {
		fetchHeatData();
	}, []);

	const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

	
	async function fetchHeatData() {
		try {
			const res = await fetch(`${BACKEND_API_URL}/api/data/`);
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
			const formattedTags = Object.keys(tags).map((tag) => ({name: tag, count: tags[tag], active: true}));
			setHeatMapFilters((prev) => ({...prev, ignoreTags: formattedTags}));

			setHeatMapRaw(data);
		} catch (err) {
			console.error("Failed to fetch incident data points", err);
		}
	}

	const checkDateRecency = (dateString, dayWindow, date=null) => {
		const targetDate = new Date(dateString).getTime();
		const now = date && date.length > 0 ? new Date(date).getTime() : new Date().getTime();
		
		const dayWindowMS = dayWindow * 24 * 60 * 60 * 1000; // in milliseconds
		
		const difference = now - targetDate;

		return difference >= 0 && difference <= dayWindowMS;
	}

	// Apply filters when data is loaded
	useEffect(() => {
		const filteredHeatMap = heatMapRaw.filter((hp) => {
			const hpTag = hp[3];
			const hpTime = hp[4];

			if (!checkDateRecency(hpTime, heatMapFilters.timePeriod, scheduledDate)) return false;

			for (const tag of heatMapFilters.ignoreTags) {
				if (hpTag == tag.name && !tag.active) {
					return false;
				}
			}

			
			return true;
		})

		setHeatMap(filteredHeatMap);

	}, [heatMapFilters, heatMapRaw, scheduledDate])

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

	const getTodayDatetime = () => {
		const now = new Date();

		now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

		// Format: YYYY-MM-DDTHH:mm
		return now.toISOString().slice(0, 16);
	}

	useEffect(() => {
		setScheduledDate(getTodayDatetime());
	}, [])

	return <>
		<RiskDataContext.Provider 
			id='riskDataContext'
			data-heatmap-loaded={heatMapRaw.length > 0 ? "true" : "false"}
			value={{
				heatMapRaw, setHeatMapRaw,
				heatMap, setHeatMap,
				heatMapFilters, setHeatMapFilters,
				setFilterTimePeriod,
				setFilterIgnoreTag,
				scheduledDate, setScheduledDate, getTodayDatetime,
				forecastReport, setForecastReport,
				forecastActive,
			}}
		>
			{children}
		</RiskDataContext.Provider>
	</>
}


function ProviderPackage({children}) {
	return <>
		<ThemeProvider>
			<AccountInfoContextProvider>
				<RiskDataContextProvider>
					{children}
				</RiskDataContextProvider>
			</AccountInfoContextProvider>
		</ThemeProvider>
	</>
}

export default function Dashboard() {
	const [camCoords, setCamCoords] = useState([47.610138, -122.201517]);
	const [markerInfo, setMarkerInfo] = useState({display_name: 'Seattle and Bellevue Area'});
	const [route, setRoute] = useState([]);
	const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
	
	const [riskZones, setRiskZones] = useState(riskZonesData.features.map(f => ({...f, active: true})));
	const [streetlightData, setStreetlightData] = useState([]) // [47.693182, -122.098657], [47.692854, -122.104909], [47.692954, -122.115051], [47.693142, -122.125091], [47.697406, -122.128552]
	const [streetlightOverride, setStreetlightOverride] = useState(false);
	const [geolocation, setGeoLocation] = useState([]);
	const [mapFocusPoint, setMapFocusPoint] = useState([]);
	const [rerouteTriggerAccess, setRerouteTriggerAccess] = useState(false);


	const finishRoute = () => {
		setRoute([]);
		setSelectedRouteIndex(0);
	}

	const toggleRiskZone = (zoneIndex) => {
		setRiskZones((prev) => {
			const next = [...prev];
			next[zoneIndex] = {...next[zoneIndex], active: !next[zoneIndex].active}
			return next;
		});
	}



	const specialPoints = {
		geolocation, mapFocusPoint,
		bounds: [-122.55, 47.35 ,-121.85 ,47.85]
	}

	return (<>
		<NotificationCard/>
		<div className={clsx(styles.dashboard)} id="dashboard">
			<ProviderPackage>
				<AccessOverridesContext.Provider value={{
					streetlightAccess: streetlightOverride, 
					setStreetlightAccess: setStreetlightOverride,
					rerouteTriggerAccess, 
					setRerouteTriggerAccess
				}}>
					<Header>
						<ForecastController/>
					</Header>
					<div className={clsx(styles.content)}>
						<SpecialPointsContext.Provider value={specialPoints}>
							<RouteSelectorPanel 
								setCamCoords={(coords, info) => {setCamCoords(coords); setMarkerInfo(info)}}
								route={route} setRoute={setRoute}
								routeInstructions={route.length > 0 ? route[selectedRouteIndex].instructions : []}
								selectedRouteIndex={selectedRouteIndex}
								riskZones={riskZones} 
								setStreetlightData={setStreetlightData}
								finishRoute={finishRoute}

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
								selectedRouteIndex={selectedRouteIndex}
								riskZones={riskZones.filter((zone) => zone.active)}
								streetlightData={streetlightOverride ? streetlightData : []}
								setGeoLocation={setGeoLocation}
								setMapFocusPoint={setMapFocusPoint}
								mapFocusPoint={mapFocusPoint}
							/>
						</SpecialPointsContext.Provider>
						<QuickRouteSelectPanel
							routesInfo={route}
							selectedIndex={selectedRouteIndex}
							setSelectedIndex={setSelectedRouteIndex}
						/>
						<StartNavigationPanel/>

						
						<CrimeLegend/>
					</div>
				</AccessOverridesContext.Provider>
			</ProviderPackage>
		</div>
	</>)
}
