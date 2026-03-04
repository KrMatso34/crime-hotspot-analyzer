import React, { useState } from 'react';

import DestinationForm from './components/DestinationForm/DestinationForm';
import FilterForm from './components/FilterForm/FilterForm';
import LiveAlertsDisplay from './components/LiveAlertsDisplay/LiveAlertsDisplay';
import InstructionsDisplay from './components/InstructionsDisplay/InstructionsDisplay';

import styles from './RouteSelectorPanel.module.css';
import clsx from 'clsx';

export default function RouteSelectorPanel({ setCamCoords, setRoute, routeInstructions=[] }) {

	return (
		<div className={clsx(styles.routeSelectorPanel)}>
			<DestinationForm 
				setCamCoords={setCamCoords} 
				setRoute={setRoute}
			/>

			<div className={clsx(styles.detailsContainer)}>
				{
					(routeInstructions.length == 0) ? (
						<>
							<FilterForm/>
							<LiveAlertsDisplay setCamCoords={setCamCoords}/>
						</>
					) : (
						<>
							<InstructionsDisplay instructions={routeInstructions}/>
						</>
					)
				}
			</div>
		</div>
	)
}
