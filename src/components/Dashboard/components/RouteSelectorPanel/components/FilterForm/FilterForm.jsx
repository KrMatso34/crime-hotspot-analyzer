import React, { useState } from 'react';

import styles from './FilterForm.module.css';
import clsx from 'clsx';

function RouteComparisonButton({ name, time, dist, risk }) {
	return (
		<div className={clsx(styles.longButton)}>
			<span>{name}</span>
			<div className={clsx(styles.routeComparisonButtonInfo)} style={{ fontSize: '12px', display: 'flex', gap: '6px' }}>
				<span>{time}m</span>
				<span>{dist}mi</span>
			</div>
		</div>
	)
}

function IncidentTypeBututon({ name, count, active, index, onClick }) {
	return (
		<div 
			className={clsx(styles.longButton, active ? styles.active : '')}
			onClick={() => onClick(index)}
		>
			<span>{name}</span>
			<span>{count}</span>
		</div>
	)
}

export default function FilterForm() {
	const [incidentTypesActive, setIncidentTypesActive] = useState([false, false, true, false, true, true, false, false]);

	const toggleIncidentType = (index) => {
		setIncidentTypesActive((prev) => {
			const next = [...prev];
			next[index] = !prev[index];
			return next;
		});
	}

	const toggleAllIncidentTypes = (newState) => {
		setIncidentTypesActive(Array(incidentTypesActive.length).fill(newState));
	}

	const incidentTypeData = [
		{name: 'Theft', count: '188'},
		{name: 'Assult', count: '69'},
		{name: 'Burglary', count: '64'},
		{name: 'Robbery', count: '21'},
		{name: 'Vandalism', count: '1'},
		{name: 'Drug', count: '20'},
		{name: 'Vehicle', count: '3'},
		{name: 'Other', count: '265'},
	]
	
	return (
		<div className={clsx(styles.filterForm)}>
			<h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700' }}>Filters</h2>
			
			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<div>
					<h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Route Comparison</h3>
					<RouteComparisonButton name='Fast' time='27' dist='14.5' risk='50'/>
					<RouteComparisonButton name='Balanced' time='32' dist='19.8' risk='30'/>
					<RouteComparisonButton name='Safe' time='36' dist='22.0' risk='65'/>
				</div>

				<div>
					<h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Time Period</h3>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button style={{ flex: 1, padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d0d0', cursor: 'pointer', background: '#fff' }}>7d</button>
						<button style={{ flex: 1, padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d0d0', cursor: 'pointer', background: '#fff' }}>30d</button>
						<button style={{ flex: 1, padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d0d0', cursor: 'pointer', background: '#fff' }}>90d</button>
					</div>
				</div>

				<div>
					<h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Incident Types</h3>
					<div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
						<button onClick={() => toggleAllIncidentTypes(true)} style={{ flex: 1, padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d0d0', cursor: 'pointer', background: '#fff' }}>All</button>
						<button onClick={() => toggleAllIncidentTypes(false)} style={{ flex: 1, padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d0d0', cursor: 'pointer', background: '#fff' }}>None</button>
					</div>
					<div className={clsx(styles.incidentTypeGrid)}>
						{
							incidentTypeData.map((incidentType, index) => (
								<IncidentTypeBututon 
									key={incidentType.name}
									name={incidentType.name} 
									count={incidentType.count} 
									active={incidentTypesActive[index]} 
									index={index}
									onClick={toggleIncidentType}
								/>
							))
						}
					</div>
				</div>
			</div>
		</div>
	)
}

