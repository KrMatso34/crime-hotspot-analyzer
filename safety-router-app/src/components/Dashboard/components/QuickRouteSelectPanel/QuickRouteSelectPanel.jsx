import React, { useState } from 'react';

import { LoadingSpinner } from './components/LoadingSpinner/LoadingSpinner';

import styles from './QuickRouteSelectPanel.module.css';
import clsx from 'clsx';

function formatDuration(ms) {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
	const days = Math.floor(ms / (1000 * 60 * 60 * 24));

	const parts = [
		{ value: days, label: 'd' },
		{ value: hours, label: 'h' },
		{ value: minutes, label: 'm' },
		{ value: seconds, label: 's' }
	];

	// Find the first unit that isn't zero
	const firstActiveIndex = parts.findIndex(p => p.value > 0);

	// If all are zero, just show 0s
	if (firstActiveIndex === -1) return "0s";

	// Return everything from the first active unit to the end
	return parts
	.slice(firstActiveIndex)
	.map(p => `${p.value}${p.label}`)
	.join(' ');
}

function RouteButton({ name, time, dist, risk, status, active=false, className, ...props }) {
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
			{
				(status=='success') ? (<>
					<span>{name.toUpperCase()}</span>
					<span>{formatDuration(time)}</span>
					<div>
						<span>{Math.round(100*dist/1609)/100} mi</span>
						<span>{risk}</span>
					</div>
				</>) : (<>
					Calculating route...
					<div className={styles.spinnerContainer}>
						<LoadingSpinner/>
					</div>
				</>)
			}
			
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
					status={route.status}
					active={index == selectedIndex} 
					onClick={() => setSelectedIndex(index)}
					className={index == 0 ? styles.leftButton : (index == routesInfo.length-1 ? styles.rightButton: '')}
				/>
			))}
		</div>
	)
}
