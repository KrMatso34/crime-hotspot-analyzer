import React, { useState } from 'react';

import styles from './QuickRouteSelectPanel.module.css';
import clsx from 'clsx';

function RouteButton({ name, time, dist, risk, active=false }) {
	return (
		<div className={clsx(styles.routeButton, active ? styles.active : '')}>
			<span>{name}</span>
			<span>{time} min</span>
			<div>
				<span>{dist} mi</span>
				<span>{risk}</span>
			</div>
		</div>
	)
}

export default function QuickRouteSelectPanel() {
	
	return (
		<div className={clsx(styles.quickRouteSelectPanel)}>
			<RouteButton name='FASTEST' time='27' dist='14.5' risk='50' active={true}/>
			<RouteButton name='BALANCED' time='32' dist='19.8' risk='30'/>
			<RouteButton name='SAFEST' time='36' dist='22.0' risk='65'/>
		</div>
	)
}
