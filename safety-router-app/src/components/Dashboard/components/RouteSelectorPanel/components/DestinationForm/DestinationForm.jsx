import React, { useState } from 'react';

import { geocodeAddress, fetchRoute } from '@services/geocode'

import AddressInput from './components/AddressInput/AddressInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

export default function DestinationForm({ setCamCoords, setRoute, heatMap, transportationMethod }) {
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	const [stops, setStops] = useState(['']);
	const [isLoading, setIsLoading] = useState(false);

	const addStop = () => {
		if (stops.length >= 5) {
			alert('Maximum 5 stops allowed');
			return;
		}
		setStops([...stops, '']);
	};

	const removeStop = (index) => {
		if (stops.length <= 1) return; 
		const newStops = stops.filter((_, i) => i !== index);
		setStops(newStops);
	};

	const updateStop = (index, value) => {
		const newStops = [...stops];
		newStops[index] = value;
		setStops(newStops);
	};

	const flyToAddress = async (address) => {
		try {
			if (!address) return;

			const result = await geocodeAddress(address);

			if (!result?.lat || !result?.lon) return;

			setCamCoords([parseFloat(result.lat), parseFloat(result.lon)], result);
		} catch (err) {
			console.error(err);
		}
	}

	const makeRoute = async (routePriority) => {
		try {
			// Group start and end with all inbetween stops
			const points = [
				origin.trim(),
				...stops.map(s => s.trim()).filter(Boolean),
				destination.trim()
			].filter(Boolean);

			if (points.length < 2) {
				alert('Please enter at least a start and destination');
				return;
			}

			const fullRoute = {
				distance: 0,
				instructions: [],
				points: [],
				time: 0,
				label: '',
			};

			console.log(transportationMethod)

			// Fetch each route between stops and group together
			for (let i = 0; i < points.length - 1; i++) {
				const from = points[i];
				const to = points[i + 1];
				const leg = await fetchRoute(from, to, routePriority, heatMap, transportationMethod);

				console.log(`[${routePriority}] (${i+1}/${points.length}): ${leg.time}`);

				fullRoute.distance += leg.distance;
				fullRoute.time += leg.time;
				fullRoute.instructions = [...fullRoute.instructions, ...leg.instructions];
				fullRoute.label = leg.label;

				if (i == points.length - 2) {
					// For the final leg include all points
					fullRoute.points.push(...leg.points);
				} else {
					// For every other leg dont include the very lsat point (the next leg will include that missing point at its start)
					fullRoute.points.push(...leg.points.slice(0, -1));
				}
			}

			return fullRoute;
		} catch (err) {
			throw err;
		}
	}


	const submitRoute = async () => {
		setIsLoading(true);
		try {
			const safeRoute = await makeRoute('safest');
			const balancedRoute = await makeRoute('balanced');
			const fastestRoute = await makeRoute('fastest');

			setRoute([safeRoute, balancedRoute, fastestRoute]);

			// Fly to starting point
			const startResult = await geocodeAddress(origin);
			if (startResult?.lat && startResult?.lon) {
				setCamCoords([parseFloat(startResult.lat), parseFloat(startResult.lon)], startResult);
			}
		} catch (err) {
			console.error(err);
			alert('Could not calculate route');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className={clsx(styles.destinationForm)}>
			<p>Seattle and Bellevue Area</p>

			<div>
				<AddressInput 
					placeholder='Enter starting point...'
					value={origin}
					onChange={(e) => setOrigin(e.target.value)}
					flyTo={flyToAddress}
				/>
				<br/>
				<AddressInput 
					placeholder='Enter destination...'
					value={destination}
					onChange={(e) => setDestination(e.target.value)}
					flyTo={flyToAddress}
				/>
			</div>

			<br />

			<div className={clsx(styles.stopsSection)}>
				<h4>Add stops (optional)</h4>

				{stops.map((stop, index) => (
					<div
						key={index}
						className={clsx(styles.stopsContainer)}
					>
						<AddressInput
							placeholder={`Stop ${index + 1}...`}
							value={stop}
							onChange={(e) => updateStop(index, e.target.value)}
							flyTo={() => flyToAddress(stop)}
						/>

						{stops.length > 1 && (
							<button
								onClick={() => removeStop(index)}
								className={clsx(styles.removeStopButton)}
							>
								×
							</button>
						)}
					</div>
				))}

				<button
					onClick={addStop}
					className={clsx(styles.addStopButton)}
				>
					+ Add another stop
				</button>
			</div>

			<button
				onClick={submitRoute}
				disabled={isLoading}
				className={clsx(styles.submitRouteButton, isLoading ? styles.loading : '')}
			>
				{isLoading ? 'Calculating...' : 'Get Safe Directions'}
			</button>
		</div>
	)
}
