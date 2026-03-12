import React, { useState } from 'react';

import styles from './LiveAlertsDisplay.module.css';
import clsx from 'clsx';

function AlertCard({ title, type, description, timestamp, routeRelevant=false, severity=0 }) {
	return (
		<div
			className={clsx(
				styles.alertCard,
				severity == 1 ? styles.warning : (severity == 2 ? styles.severe : ''),
			)}
		>
			<h3>{title}</h3>
			<span className={clsx(styles.incidentTypeChip)}>{type}</span>
			<p>{description}</p>
			<span>{timestamp}</span>
		</div>
	)
}

export default function LiveAlertsDisplay() {
	const alertsData = [
		{
			title: 'Package Theft Reported',
			type: 'Theft',
			description: 'Multiple package thefts reported in Capitol Hill area. Be vigilant...',
			timestamp: 'about 1 hour ago',
			routeRelevant: false,
			severity: 1,
		},
		{
			title: 'Car Break-ins Near Pike Place',
			type: 'Vehicle Crime',
			description: 'Several car break-ins reported in parking lots near Pike Place...',
			timestamp: 'about 2 hours ago',
			routeRelevant: false,
			severity: 2,
		},
		{
			title: 'Road Closure - Downtown',
			type: 'Other',
			description: 'Temporary road closure on 3rd Ave due to police activity. Expect...',
			timestamp: 'about 1 hour ago',
			routeRelevant: true,
			severity: 0,
		}
	]
	
	return (
		<div className={clsx(styles.liveAlertsDisplay)}>
			<h2>Live Alerts</h2>
			{
				alertsData.map((alert) => 
					<AlertCard 
						key={alert.title} 
						{...alert}
					/>
				)
			}
		</div>
	)
}
