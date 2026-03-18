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
	setRoute, 
	heatMap, 
	routeInstructions=[], 
	finishRoute, 
	heatMapFilters,
	setFilterTimePeriod,
	setFilterIgnoreTag 
}) {
	const [transportationMethod, setTransportationMethod] = useState('car');

	return (
		<div className={clsx(styles.routeSelectorPanel)}>
			<DestinationForm 
				setCamCoords={setCamCoords} 
				setRoute={setRoute}
				heatMap={heatMap}
				transportationMethod={transportationMethod}
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
