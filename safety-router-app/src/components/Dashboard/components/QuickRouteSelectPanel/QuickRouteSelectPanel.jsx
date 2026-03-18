import React, { useState } from 'react';

import styles from './QuickRouteSelectPanel.module.css';
import clsx from 'clsx';

function RouteButton({ name, time, dist, risk, active=false, className, ...props }) {
	const routeColors = {
		safest: 'cyan',
		fastest: 'red',
		balanced: 'lime'
	}
	return (
		<div 
			className={clsx(
				styles.routeButton, 
				className, 
				active && styles.active
			)} 
			style={{'--route-color': routeColors[name] ?? 'white'}}
			{...props}
		>
			<span>{name.toUpperCase()}</span>
			<span>{Math.round(100*2*time/60000)/100} min</span>
			<div>
				<span>{Math.round(100*dist/1609)/100} mi</span>
				<span>{risk}</span>
			</div>
		</div>
	)
}

export default function QuickRouteSelectPanel({ routesInfo, selectedIndex, setSelectedIndex }) {
	
	return (
		<div className={clsx(styles.quickRouteSelectPanel)}>
			{routesInfo.map((route, index) => (
				<RouteButton 
					key={index} 
					name={route.label} 
					time={route.time} 
					dist={route.distance} 
					risk={route.risk} 
					active={index == selectedIndex} 
					onClick={() => setSelectedIndex(index)}
					className={index == 0 ? styles.leftButton : (index == routesInfo.length-1 ? styles.rightButton: '')}
				/>
			))}
		</div>
	)
}
