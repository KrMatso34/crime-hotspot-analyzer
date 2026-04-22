import React, { useState, useEffect } from 'react';

import { TriangleAlert, RefreshCw } from 'lucide-react';

import styles from './LiveAlertsDisplay.module.css';
import clsx from 'clsx';

function AlertCard({ title, type, description, timestamp, lat, lng, severity=0, setCamCoords, loading=false }) {
	const validLocal = lat && lng;
	return (
		<div
			className={clsx(
				styles.alertCard,
				severity == 1 ? styles.warning : (severity == 2 ? styles.severe : ''),
				validLocal ? styles.hoverable : ''
			)}
			onClick={() => {
				if (validLocal) {
					setCamCoords([lat, lng], {name: title, display_name: description})
				}
			}}
		>
			<div className={clsx(styles.alertHeader)}>
				<TriangleAlert/>
				<h2>{!loading ? title : '...'}</h2>
			</div>
			<h5 className={clsx(styles.incidentTypeChip)}>{!loading ? type : '...'}</h5>
			<p>{!loading ? description : '...'}</p>
			<span>{!loading ? new Date(timestamp).toLocaleString() : '...'}</span>
		</div>
	)
}

export default function LiveAlertsDisplay({setCamCoords}) {
	const [alerts, setAlerts] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchAlerts();

		//const interval = setInterval(fetchAlerts, 60000); // poll every 60 sec
		//return () => clearInterval(interval);
	}, []);

	async function fetchAlerts() {
		setLoading(true);
		try {
			const res = await fetch("http://localhost:4000/api/spd-alerts");
			const data = await res.json();
			setLoading(false);
			setAlerts(data);
		} catch (err) {
			console.error("Failed to fetch alerts", err);
		}
	}
	
	return (
		<div className={clsx(styles.liveAlertsDisplay)}>
			<div className={clsx(styles.liveAlertsHeader)}>
				<h2>Live Alerts</h2>
				<RefreshCw onClick={fetchAlerts}/>
			</div>
			{
				alerts && alerts.map((alert, index) => 
					<AlertCard 
						key={alert.id} 
						{...alert}
						loading={loading}
						setCamCoords={setCamCoords}
					/>
				)
			}
		</div>
	)
}
