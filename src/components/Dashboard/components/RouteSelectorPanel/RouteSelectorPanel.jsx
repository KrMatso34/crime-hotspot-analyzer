import React, { useState } from 'react';

import DestinationForm from './components/DestinationForm/DestinationForm';
import FilterForm from './components/FilterForm/FilterForm';
import LiveAlertsDisplay from './components/LiveAlertsDisplay/LiveAlertsDisplay';
import RiskAssessment from '../../../RiskAssessment/RiskAssessment';
import RiskDisplay from '../../../RiskDisplay/RiskDisplay';

import styles from './RouteSelectorPanel.module.css';
import clsx from 'clsx';

export default function RouteSelectorPanel({ setCamCoords, setRouteCoords, onClose, onRouteRiskUpdate, crimeHotspots = [] }) {
	const [routeRiskScore, setRouteRiskScore] = useState(null);
	const [routeDistance, setRouteDistance] = useState(null);
	const [routeDuration, setRouteDuration] = useState(null);

	const handleRouteSelected = (routeData) => {
		if (routeData.riskAssessment !== undefined) {
			setRouteRiskScore(routeData.riskAssessment);
			// Notify parent component of route risk score
			if (onRouteRiskUpdate) {
				onRouteRiskUpdate(routeData.riskAssessment);
			}
		}
		if (routeData.distance) {
			setRouteDistance(routeData.distance);
		}
		if (routeData.duration) {
			setRouteDuration(routeData.duration);
		}
	};

	return (
		<div className={clsx(styles.routeSelectorPanel)}>
			<DestinationForm 
				setCamCoords={setCamCoords} 
				setRouteCoords={setRouteCoords}
				onRouteSelected={handleRouteSelected}
				crimeHotspots={crimeHotspots}
			/>

			{/* Risk Assessment Display */}
			{routeRiskScore !== null && (
				<div className={styles.riskAssessmentContainer}>
					<RiskDisplay 
						riskScore={routeRiskScore}
						routeDistance={routeDistance}
						routeDuration={routeDuration}
						showDetails={true}
					/>
				</div>
			)}

			<div className={clsx(styles.detailsContainer)}>
				<FilterForm/>
				<LiveAlertsDisplay/>
			</div>
		</div>
	);
}
