import React, { useState } from 'react';

import Header from './components/Header/Header';
import Map from './components/Map/Map';
import QuickRouteSelectPanel from './components/QuickRouteSelectPanel/QuickRouteSelectPanel';
import RouteSelectorPanel from './components/RouteSelectorPanel/RouteSelectorPanel';
import StartNavigationPanel from './components/StartNavigationPanel/StartNavigationPanel';

import styles from './Dashboard.module.css';
import clsx from 'clsx';

export default function Dashboard() {
	const [camCoords, setCamCoords] = useState([47.6101, -122.2015]); // Bellevue, WA
	const [markerInfo, setMarkerInfo] = useState({});
	const [routeCoords, setRouteCoords] = useState([]);
	
	return (
		<div className={clsx(styles.dashboard)}>
			<Header/>
			<div className={clsx(styles.content)}>
				<RouteSelectorPanel 
					setCamCoords={(coords, info) => {setCamCoords(coords); setMarkerInfo(info)}}
					setRouteCoords={setRouteCoords}
				/>
				
				<Map 
					center={camCoords} 
					markerInfo={markerInfo} 
					routeCoords={routeCoords}
				/>
				<QuickRouteSelectPanel/>
				<StartNavigationPanel/>
			</div>
		</div>
	)
}
