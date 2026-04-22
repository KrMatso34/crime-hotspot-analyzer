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

export default function FilterForm({ 
	setFilterTimePeriod, 
	setFilterIgnoreTag, 
	heatMapFilters=[], 
	riskZones, 
	toggleRiskZone,
	streetlightOverride,
	setStreetlightOverride,
}) {

	const [curPageKey, setCurPageKey] = useState('time');

	const toggleIncidentType = (index) => {
		setFilterIgnoreTag(index);
	}

	const toggleAllIncidentTypes = (newState) => {
		for (let i = 0; i < heatMapFilters.ignoreTags.length; i ++) {
			setFilterIgnoreTag(i, newState);
		}
	}

	const timePeriodChoices = [7, 30, 90];
	
	const TabButton = function({ pageKey, children }) {
		return (<>
			<button 
				className={
					clsx(
						styles.tabButton,
						curPageKey==pageKey && styles.active
					)
				}
				onClick={() => setCurPageKey(pageKey)}
			>
				{children}
			</button>
		</>)
	}

	return (
		<div className={clsx(styles.filterForm)}>
			<h2>Filters</h2>

			<div
				className={styles.tabContainer}
			>
				<TabButton pageKey='time'>Time Period</TabButton>
				<TabButton pageKey='type'>Incident Type</TabButton>
				<TabButton pageKey='zone'>Risk Zones</TabButton>
				<TabButton pageKey='light'>Street Lights</TabButton>
			</div>
			

			<div
				className={styles.tabContentContainer}
			>
				{
					curPageKey == 'time' && <div>
						<p> * How recent should the incident be in order to be relevant to your route?</p>
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
				}

				{
					curPageKey == 'type' && <div>
						<p> * What types of incidents are relevant to your route?</p>
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
				}

				{
					curPageKey == 'zone' && <div>
						<p> * Which historically risky areas are relevant to your route?</p>
						{riskZones.map((zone, i) => (
							<div className={styles.riskZoneContainer}>
								<button 
									key={zone.properties.name}
									className={clsx(zone.active ? styles.selectedTimePeriodButton : '')}
									onClick={() => toggleRiskZone(i)}
								>
									{zone.properties.name}
								</button>
								<p>{zone.properties.notes}</p>
							</div>
						))}
					</div>
				}

				{
					// TODO: add functionality ###########################################################################################
					curPageKey == 'light' && <div>
						<p> * Are street lights relevant to your route?</p>
						<input type="checkbox"/> Automatically turn on between 7:00pm and 8:00am
						<br/>
						<input type="checkbox" checked={streetlightOverride} onChange={(ev) => setStreetlightOverride(ev.target.checked)}/> Manually override
					</div>
				}
			</div>
			
		</div>
	)
}

