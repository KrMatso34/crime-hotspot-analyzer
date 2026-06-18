import React, { useState, useContext } from 'react';

import styles from './FilterForm.module.css';
import clsx from 'clsx';

import { AccessOverridesContext } from '../../../../Dashboard'
import { InfoButton } from '../../../InfoButton/InfoButton';

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
}) {

	const [curPageKey, setCurPageKey] = useState('time');

	const {setStreetlightAccess, streetlightAccess, rerouteTriggerAccess, setRerouteTriggerAccess} = useContext(AccessOverridesContext)

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
				<TabButton pageKey='light'>Other</TabButton>
			</div>
			

			<div
				className={styles.tabContentContainer}
			>
				{
					curPageKey == 'time' && <div>
						<div className={clsx(styles.filterTitle)}>
							<h3>Time Period</h3>
							<InfoButton direction="right">The <strong>Time Period</strong> filter effects the risk heatmap data. The filter determines how recent a crime can be in order to be displayed on the map and considered when building your route. For example, selecting "7 days" means only week-old incident data will be considered. </InfoButton>
						</div>
						<br/>
						{timePeriodChoices.map((period) => (
							<button 
								key={period}
								className={clsx(heatMapFilters.timePeriod == period ? styles.selectedTimePeriodButton : '')}
								onClick={() => setFilterTimePeriod(period)}
							>
								{period} days
							</button>
						))}
					</div>
				}

				{
					curPageKey == 'type' && <div>
						<div className={clsx(styles.filterTitle)}>
							<h3>Incident Type</h3>
							<InfoButton direction="right">The <strong>Incident Type</strong> filter effects the risk heatmap data. This filter determines what types of crimes should be displayed and considered on the map when building your route. Often, all types are crimes are relevant to contributing to risky areas. In this case, simply press the "All" button to fully activate the heatmap. However, if you consider certain non-severe crimes perhaps like vandalism to not be relevant, feel free to click the associated button to toggle it off.</InfoButton>
						</div>
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
						<div className={clsx(styles.filterTitle)}>
							<h3>Risk Zones</h3>
							<InfoButton direction="right">The <strong>Risk Zones</strong> filter effects the various red polygons across the map. Each region is a historically risky area and are to be avoided when creating routes when ensuring safety. The regions listed below also have a small description of their historical relevance. However, strictly avoiding such areas may not always be convenient in your route, so feel free to disable them by clicking the toggle buttons associated with each region.</InfoButton>
						</div>
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
					curPageKey == 'light' && <div>
						<div className={clsx(styles.filterTitle)}>
							<h3>Other</h3>
							<InfoButton direction="right">The miscellaneous filters include manual overwrites to trigger functions regardless of default conditionals. Streetlights are usually only considered if your route is created during dark hours, but checking the "activate streetlight times" checkbox will always consider streetlights when building your route. The "activate rerouting trigger" will allow the app to automatically retrigger a route creation if your device's location strays too far off from your route, say, if you make a wrong turn or miss an exit.</InfoButton>
						</div>
						<input type="checkbox" checked={streetlightAccess} onChange={(ev) => setStreetlightAccess(ev.target.checked)}/> Activate streetlight times
						<br/>
						<br/>
						<input type="checkbox" checked={rerouteTriggerAccess} onChange={(ev) => setRerouteTriggerAccess(ev.target.checked)}/> Activate rerouting trigger
					</div>
				}
			</div>
			
		</div>
	)
}

