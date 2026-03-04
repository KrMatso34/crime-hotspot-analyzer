import React, { useState, createContext, useEffect } from 'react';

import Header from './components/Header/Header';
import Map from './components/Map/Map';
import QuickRouteSelectPanel from './components/QuickRouteSelectPanel/QuickRouteSelectPanel';
import RouteSelectorPanel from './components/RouteSelectorPanel/RouteSelectorPanel';
import StartNavigationPanel from './components/StartNavigationPanel/StartNavigationPanel';

import styles from './Dashboard.module.css';
import clsx from 'clsx';

export default function Dashboard() {
	const [camCoords, setCamCoords] = useState([51.505, -0.09]);
	const [markerInfo, setMarkerInfo] = useState({});
	const [route, setRoute] = useState({});

	return (
		<div className={clsx(styles.dashboard)}>
			<Header/>
			<div className={clsx(styles.content)}>
				<RouteSelectorPanel 
					setCamCoords={(coords, info) => {setCamCoords(coords); setMarkerInfo(info)}}
					setRoute={setRoute}
					routeInstructions={route ? route.instructions : []}
				/>
				
				<Map 
					center={camCoords} 
					markerInfo={markerInfo} 
					routeCoords={route ? route.points : []}
				/>
				<QuickRouteSelectPanel/>
				<StartNavigationPanel/>
			</div>
		</div>
	)
}
