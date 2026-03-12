import React, { useState } from 'react';

import DestinationForm from './components/DestinationForm/DestinationForm';
import FilterForm from './components/FilterForm/FilterForm';
import LiveAlertsDisplay from './components/LiveAlertsDisplay/LiveAlertsDisplay';

import styles from './RouteSelectorPanel.module.css';
import clsx from 'clsx';

export default function RouteSelectorPanel({ setCamCoords, setRouteCoords }) {

	return (
		<div className={clsx(styles.routeSelectorPanel)}>
			<DestinationForm setCamCoords={setCamCoords} setRouteCoords={setRouteCoords}/>

			<div className={clsx(styles.detailsContainer)}>
				<FilterForm/>
				<LiveAlertsDisplay/>
			</div>
		</div>
	)
}
