import React, { useState } from 'react';

import styles from './FilterForm.module.css';
import clsx from 'clsx';

function RouteComparisonButton({ name, time, dist, risk }) {
	return (
		<div className={clsx(styles.longButton)}>
			<span>{name}</span>
			<div className={clsx(styles.routeComparisonButtonInfo)}>
				<span>{time} min</span>
				<span>{dist} mi</span>
				<span>{risk}</span>
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

export default function FilterForm({ setFilterTimePeriod, setFilterIgnoreTag, heatMapFilters=[] }) {

	const toggleIncidentType = (index) => {
		setFilterIgnoreTag(index);
	}

	const toggleAllIncidentTypes = (newState) => {
		for (let i = 0; i < heatMapFilters.ignoreTags.length; i ++) {
			setFilterIgnoreTag(i, newState);
		}
	}

	const timePeriodChoices = [7, 30, 90];
	

	return (
		<div className={clsx(styles.filterForm)}>
			<h2>Filters</h2>
			

			<div>
				<h3>Time Period</h3>
				{timePeriodChoices.map((period) => (
					<button 
						key={period}
						className={clsx(heatMapFilters.timePeriod == period ? styles.selectedTimePeriodButton : '')}
						onClick={() => setFilterTimePeriod(period)}
					>
						{period}d
					</button>
				))}
			</div>
			<hr/>

			<div>
				<h3>Incident Types</h3>
				<div>
					<button onClick={() => toggleAllIncidentTypes(true)}>All</button>
					<button onClick={() => toggleAllIncidentTypes(false)}>None</button>
				</div>
				<div className={clsx(styles.incidentTypeGrid)}>
					{
						heatMapFilters.ignoreTags.length == 0 ? <p>Loading...</p> : ''
					}
					{
						heatMapFilters.ignoreTags.map((tagData, index) => (
							<IncidentTypeBututon 
								key={tagData.name}
								name={tagData.name} 
								count={tagData.count} 
								active={tagData.active} 
								index={index}
								onClick={toggleIncidentType}
							/>
						))
					}
				</div>
			</div>
			<hr/>
			
		</div>
	)
}

