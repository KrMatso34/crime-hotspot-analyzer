import React, { useState, useEffect } from 'react'

import styles from './ForecastController.module.css'
import clsx from 'clsx';

import { ChevronUp, ChevronDown, Moon, Sun } from 'lucide-react'
import { useRiskHeatmapData } from '../../Dashboard';
import { InfoButton } from '../InfoButton/InfoButton';

export function ForecastController({}) {
	const [scheduleNow, setScheduleNow] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [scheduledDate, setScheduledDate] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [successMsg, setSuccessMsg] = useState('');
	const [darkHours, setDarkHours] = useState('');

	const heatmap = useRiskHeatmapData();
	const forecast = heatmap.forecastReport;

	const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

	useEffect(() => {
		if (!scheduleNow) {
			setScheduledDate(heatmap.getTodayDatetime());
		}
	}, [scheduleNow]);

	useEffect(() => {
		setErrorMsg('');
		setSuccessMsg('');

		const d = new Date(scheduledDate);
		const dark = d.getHours() < 8 || d.getHours() >= 19;
		setDarkHours(dark)
	}, [scheduledDate]);


	const applySchedule = () => {
		if (!datetimePattern.test(scheduledDate)) {
			setErrorMsg('Invalid datetime format. Expected YYYY-MM-DDTHH:mm');
			setSuccessMsg('');
			return;
		}
		setErrorMsg('');
		setSuccessMsg('Successfully applied new date');


		heatmap.setScheduledDate(scheduledDate);
	}

	return (
		<div className={styles.floatingContainer}>
			{isOpen && <div className={styles.forecastController}>
				<div className={styles.scheduleOptionsContainer}>
					<span>{scheduleNow ? 'Schedule departure now' : 'Schedule departure later'}</span>
					<input type="checkbox" checked={scheduleNow} onChange={(e) => setScheduleNow(e.target.checked)}/>
				</div>
				{!scheduleNow && 
				<div>
					<div>
						<h3>Forecast risk</h3>
						<div>
							<div className={styles.darkHoursDisplay}>
								{darkHours ? <Moon/> : <Sun/>}
								{/* <span>Dark hours</span> */}
							</div>
						</div>
						<input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}/>
						<div>
							<button onClick={applySchedule}>Apply</button>
							<span className={clsx(styles.error)}>{errorMsg}</span>
							<span>{successMsg}</span>
						</div>
					</div>
					{(forecast.safetyConfidence) &&
						<div className={clsx(styles.safetyConfidenceReport)}>
							<div>
								<h3>Forecast Route Report</h3>
								<InfoButton>The <strong>Forecast Report feature</strong> considers the surrounding crime incident data to make a educated prediction of how safe a route will be sometime in the future. Aspects such as the following are considered: Does the scheduled time's type of day (weekday vs weekend) and approximate time match a nearby crime incident? Is the nearby crime incident old enough to be negligable? How severe or violent are the surrounding crimes? </InfoButton>
							</div>
							<p>Safety Confidence: {forecast.safetyConfidence}</p>
							<p>Tier: {forecast.tier}</p>
							<p>Nearby Historical Incident Count: {forecast.totalHistoricalIncidentsNearby}</p>
							<p className={clsx(styles.message)}>{forecast.message}</p>
						</div>
					}
				</div>}
			</div>}
			<button 
				onClick={() => setIsOpen((prev) => !prev)}
				className={styles.floatingButton}
			>
				{isOpen ? <ChevronUp/> : <ChevronDown/>}
			</button>
		</div>
	)
}