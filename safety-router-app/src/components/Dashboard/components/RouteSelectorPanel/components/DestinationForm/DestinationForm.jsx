import React, { useEffect, useState } from 'react';

import { geocodeAddress, fetchRoute } from '@services/geocode'

import AddressInput from './components/AddressInput/AddressInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

import {clusterByGrid} from './util'

export default function DestinationForm({ setCamCoords, setRoute, route, heatMap, riskZones, setStreetlightData, useStreetlights=true, transportationMethod }) {
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	const [stops, setStops] = useState(['']);
	const [isLoading, setIsLoading] = useState(false);

	const routeTypeIndex = {
		safest: 0,
		balanced: 1,
		fastest: 2,
	}

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

			if (!result?.lat || !result?.lon) throw Error('Invalid lat/lon coords');

			setCamCoords([parseFloat(result.lat), parseFloat(result.lon)], result);
		} catch (err) {
			console.error(err);
			alert('Could not geolocate address')
			throw err;
		}
	}

	const makeRoute = async (routePriority, streetlightData) => {
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
				status: 'success'
			};

			// Fetch each route between stops and group together
			for (let i = 0; i < points.length - 1; i++) {
				const from = points[i];
				const to = points[i + 1];
				const leg = await fetchRoute(from, to, routePriority, heatMap, riskZones, streetlightData, transportationMethod);

				//console.log(`[${routePriority}] (${i+1}/${points.length}): ${leg.time}`);

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

	const addRoute = (routeName, routeData) => {
		setRoute((prev) => {
			const next = [...prev];
			next[routeTypeIndex[routeName]] = routeData;
			return next;
		})
	}

	const clearRoutes = () => {
		setRoute([
			{
				status: 'loading',
				distance: 0,
				instructions: [],
				points: [],
				time: 0,
				label: 'safest',
			},
			{
				status: 'loading',
				distance: 0,
				instructions: [],
				points: [],
				time: 0,
				label: 'balanced',
			},
			{
				status: 'loading',
				distance: 0,
				instructions: [],
				points: [],
				time: 0,
				label: 'fastest',
			}
		])
	}

	const setRouteError = (routeName) => {
		setRoute((prev) => {
			const next = [...prev];
			next[routeTypeIndex[routeName]] = {
				status: 'loading',
				distance: 0,
				instructions: [],
				points: [],
				time: 0,
				label: routeName,
			};
			return next;
		})
	}

	useEffect(() => {
		if (route[0] && route[1] && route[2]) {
			setIsLoading(false);
		}
	}, [route]);

	const loadStreetLights = async (originLat, originLon, destinationLat, destinationLon) => {

		if (!useStreetlights) return [];
		
		const minLat = Math.min(originLat, destinationLat);
		const minLon = Math.min(originLon, destinationLon);
		const maxLat = Math.max(originLat, destinationLat);
		const maxLon = Math.max(originLon, destinationLon);

		const res = await fetch(`http://localhost:4000/api/lights/${minLat}/${minLon}/${maxLat}/${maxLon}`);
		const data = await res.json();

		return clusterByGrid(
			data.map(light => [Number(light.lat), Number(light.lon)]), 
			{minLat, minLon, maxLat, maxLon}, 
			15
		)
			.map(d => [d.lat, d.lon])


		//return data.map(light => [light.lat, light.lon]).slice(0, Math.min(data.length, 100));
	}

	const submitRoute = async () => {
		
		setIsLoading(true);
		clearRoutes();

		try {
			const originCoords = await geocodeAddress(origin);
			const destinationCoords = await geocodeAddress(destination);


			const streetlightData = await loadStreetLights(originCoords.lat, originCoords.lon, destinationCoords.lat, destinationCoords.lon);
			

			setStreetlightData(streetlightData);


			makeRoute('safest', streetlightData)
				.then(
					(value) => addRoute('safest', value)
				)
				.catch((err) => {
					setRouteError('safest')
					throw err;
				})
			makeRoute('balanced', streetlightData)
				.then(
					(value) => addRoute('balanced', value)
				)
				.catch((err) => {
					setRouteError('balanced')
					throw err;
				})
			makeRoute('fastest', streetlightData)
				.then(
					(value) => addRoute('fastest', value)
				)
				.catch((err) => {
					setRouteError('fastest')
					throw err;
				})

			flyToAddress(origin);
		} catch (err) {
			console.error(err);
			alert('Could not calculate route');
			setIsLoading(false);
		} finally {
			
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
