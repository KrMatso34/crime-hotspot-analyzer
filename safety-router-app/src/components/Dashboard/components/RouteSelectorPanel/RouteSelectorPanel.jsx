import React, { useState } from 'react';

import DestinationForm from './components/DestinationForm/DestinationForm';
import FilterForm from './components/FilterForm/FilterForm';
import LiveAlertsDisplay from './components/LiveAlertsDisplay/LiveAlertsDisplay';
import InstructionsDisplay from './components/InstructionsDisplay/InstructionsDisplay';

import styles from './RouteSelectorPanel.module.css';
import clsx from 'clsx';
import './formStyles.css';
import { TransportationSelector } from './components/TransportationSelector/TransportationSelector';

export default function RouteSelectorPanel({ 
	setCamCoords, 
	route,
	setRoute, 
	selectedRouteIndex,
	heatMap, 
	riskZones,
	setStreetlightData,
	routeInstructions=[], 
	finishRoute, 
	heatMapFilters,
	setFilterTimePeriod,
	setFilterIgnoreTag,
	toggleRiskZone,
	streetlightOverride,
	setStreetlightOverride,
	geolocation,
	mapFocusPoint,
}) {
	const [transportationMethod, setTransportationMethod] = useState('car');

	return (
		<div className={clsx(styles.routeSelectorPanel)}>
			<DestinationForm 
				setCamCoords={setCamCoords} 
				route={route} setRoute={setRoute} selectedRouteIndex={selectedRouteIndex}
				heatMap={heatMap}
				riskZones={riskZones}
				setStreetlightData={setStreetlightData}
				transportationMethod={transportationMethod}
				useStreetlights={streetlightOverride}
				geolocation={geolocation}
				mapFocusPoint={mapFocusPoint}
			/>

			<div className={clsx(styles.detailsContainer)}>
				{
					(routeInstructions.length == 0) ? (
						<>
							<TransportationSelector
								transportationMethod={transportationMethod}
								setTransportationMethod={setTransportationMethod}
							/>
							<FilterForm 
								setFilterTimePeriod={setFilterTimePeriod} 
								setFilterIgnoreTag={setFilterIgnoreTag}
								heatMapFilters={heatMapFilters}
								riskZones={riskZones}
								toggleRiskZone={toggleRiskZone}
								streetlightOverride={streetlightOverride}
								setStreetlightOverride={setStreetlightOverride}
							/>
							<LiveAlertsDisplay setCamCoords={setCamCoords}/>
						</>
					) : (
						<>
							<button onClick={finishRoute}>Cancel Route</button>
							<InstructionsDisplay instructions={routeInstructions}/>
						</>
					)
				}
			</div>
		</div>
	)
}
