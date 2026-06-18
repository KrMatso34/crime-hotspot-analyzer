import React, { useEffect, useState, useContext } from 'react';

import { geocodeAddress, fetchRoute } from '@services/geocode'

import { AccessOverridesContext, useRiskHeatmapData, useSpecialPoints } from '../../../../Dashboard'

import { AddressListInput } from './components/AdressListInput/AddressListInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

import { scoreRoute } from '@services/geocode';

import {clusterByGrid, distanceToPath} from './util'
import { alert } from '../../../Notifications/useNotification'

export default function DestinationForm({ 
	setCamCoords, 
	setRoute, 
	route, 
	selectedRouteIndex,
	heatMap, 
	riskZones, 
	setStreetlightData, 
	useStreetlights=true, 
	transportationMethod, 
	geolocation,
	mapFocusPoint,
}) {

	const [errorMsg, setErrorMsg] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [retriggerSavedIndex, setRetriggerSavedIndex] = useState(0);

	const [newStops, setNewStops] = useState([{id: 'item-1', content: ''}, {id: 'item-2', content: ''}]);
	const origin = newStops[0].content;
	const destination = newStops[newStops.length-1].content;
	const stops = newStops.map(s => s.content).slice(1,newStops.length-1);

	const {setStreetlightAccess, streetlightAccess, rerouteTriggerAccess, setRerouteTriggerAccess} = useContext(AccessOverridesContext)
	const { forecastActive, setForecastReport, scheduledDate } = useRiskHeatmapData();
	const { bounds } = useSpecialPoints();

	const routeTypeIndex = {
		safest: 0,
		balanced: 1,
		fastest: 2,
	}

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

	const makeRoute = async (routePriority, start=origin, end=destination, streetlightData) => {
		try {
			// Group start and end with all inbetween stops
			const points = [
				start.trim(),
				...stops.map(s => s.trim()).filter(Boolean),
				end.trim()
			].filter(Boolean);

			if (points.length < 2) {
				alert('Please enter at least a start and destination');
				return;
			}

			const fullRoute = makeRouteObject({status: 'success'})

			// Fetch each route between stops and group together
			for (let i = 0; i < points.length - 1; i++) {
				const from = points[i];
				const to = points[i + 1];
				const leg = await fetchRoute(from, to, routePriority, heatMap, riskZones, streetlightData, transportationMethod);

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

			fullRoute.score = scoreRoute(fullRoute.points, heatMap)

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

	const makeRouteObject = (data) => {
		return {
			distance: 0,
			instructions: [],
			points: [],
			time: 0,
			label: '',
			status: 'success',
			score: 0,
			...data
		}
	}

	const clearRoutes = () => {
		setRoute([
			makeRouteObject({status: 'loading', label: 'safest'}),
			makeRouteObject({status: 'loading', label: 'balanced'}),
			makeRouteObject({status: 'loading', label: 'fastest'}),
		])
	}

	const setRouteError = (routeName) => {
		setRoute((prev) => {
			const next = [...prev];
			next[routeTypeIndex[routeName]] = makeRouteObject({status: 'error', label: routeName})
			return next;
		})
	}

	useEffect(() => {
		if (route[0] && route[1] && route[2]) {
			setIsLoading(false);
		}
	}, [route]);

	const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

	const loadStreetLights = async (originLat, originLon, destinationLat, destinationLon) => {

		if (!useStreetlights) return [];
		
		const minLat = Math.min(originLat, destinationLat);
		const minLon = Math.min(originLon, destinationLon);
		const maxLat = Math.max(originLat, destinationLat);
		const maxLon = Math.max(originLon, destinationLon);

		const res = await fetch(`${BACKEND_API_URL}/api/lights/${minLat}/${minLon}/${maxLat}/${maxLon}`);
		const data = await res.json();

		return clusterByGrid(
			data.map(light => [Number(light.lat), Number(light.lon)]), 
			{minLat, minLon, maxLat, maxLon}, 
			15
		)
			.map(d => [d.lat, d.lon])


		//return data.map(light => [light.lat, light.lon]).slice(0, Math.min(data.length, 100));
	}

	const submitRoute = async (start=origin, end=destination) => {

		if (await checkSubmitErrors()) return;
		setErrorMsg('');
		
		setIsLoading(true);
		clearRoutes();

		try {
			const originCoords = await geocodeAddress(start);
			const destinationCoords = await geocodeAddress(end);

			const streetlightData = await loadStreetLights(originCoords.lat, originCoords.lon, destinationCoords.lat, destinationCoords.lon);
			
			setStreetlightData(streetlightData);

			makeRoute('safest', start, end, streetlightData)
				.then(
					(value) => addRoute('safest', value)
				)
				.catch((err) => {
					setRouteError('safest')
					throw err;
				})
			makeRoute('balanced', start, end, streetlightData)
				.then(
					(value) => addRoute('balanced', value)
				)
				.catch((err) => {
					setRouteError('balanced')
					throw err;
				})
			makeRoute('fastest', start, end, streetlightData)
				.then(
					(value) => addRoute('fastest', value)
				)
				.catch((err) => {
					setRouteError('fastest')
					throw err;
				})
			
			

			flyToAddress(start);

			if (forecastActive) makeForecastReport(originCoords.lat, originCoords.lon, scheduledDate, heatMap)
		} catch (err) {
			console.error(err);
			alert('Could not calculate route');
			setIsLoading(false);
		}
	}

	const makeForecastReport = async (targetLat, targetLon, travelTime, crimes) => {
		const API_URL = `${BACKEND_API_URL}/api/prediction/safetyReport`; 

		// Construct the request payload
		const payload = {
			targetLat: parseFloat(targetLat),
			targetLon: parseFloat(targetLon),
			travelTime: travelTime,
			crimes: crimes 
		};

		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			
			// Expected output shape: { safetyConfidence: "85%", tier: "Safe", totalHistoricalIncidentsNearby: 14 }
			setForecastReport(data)
			
			return data;
		} catch (error) {
			console.error('Failed to fetch safety prediction from API:', error);
			return null;
		}
	}

	const checkRouteRetrigger = () => {
		if (!rerouteTriggerAccess) return;
		if (route.length != 3 || !destination || geolocation.length != 2) return;
		if (route[0].status != "success" || route[1].status != "success" || route[2].status != "success") return;

		const threshold = 0.0018; // about 200 meters
		const res = distanceToPath(geolocation, route[selectedRouteIndex].points, threshold, retriggerSavedIndex, setRetriggerSavedIndex);

		if (!res) return;

		alert.show("Wrong turn: Rerouting...", "error", 5000);

		submitRoute(`${geolocation[0]}, ${geolocation[1]}`, destination);
	}

	useEffect(() => {
		const intervalId = setInterval(() => {
			checkRouteRetrigger();
		}, 10000);

		return () => clearInterval(intervalId)
	})

	/* DEPRICATED
	function InsertLocationButton({ setValue, focusName='' }) {
		if (addressInputFocus != focusName) return;

		return (
			<div>
				<button 
					disabled={geolocation.length == 0}
					onClick={(ev) => setValue(`${geolocation[0]}, ${geolocation[1]}`)}
					onMouseDown={(ev) => ev.preventDefault()}	
					className={clsx(styles.insertLocationButton)}
				>
					<LocateFixed/> Use current location
				</button>
				<button 
					disabled={mapFocusPoint.length == 0}
					onClick={(ev) => setValue(`${mapFocusPoint[0]}, ${mapFocusPoint[1]}`)}
					onMouseDown={(ev) => ev.preventDefault()}	
					className={clsx(styles.insertLocationButton)}
				>
					<Map/> Choose location on map
				</button>
			</div>
		)
	}
	*/

	function isInBounds({lat, lon}) {
		// Washington bounds: latNumb > 45.5343205 && latNumb < 60.777027 && lonNumb > -148.6745055 && lonNumb < -116.867263;
		const latNumb = Number(lat);
		const lonNumb = Number(lon);

		// King County boundds
		return latNumb > bounds[1] && lonNumb > bounds[0] && latNumb < bounds[3] && lonNumb < bounds[2];
	}

	async function checkSubmitErrors() {
		let errorMsg = '';
		for (const stop of newStops) {
			if (stop.content.length == 0) {
				errorMsg = 'Error: Address field(s) cannot be empty.';
				break;
			}
		}
		if (errorMsg == '') {
			for (const stop of newStops) {
				const coords = await geocodeAddress(stop.content);
				if (!coords || !isInBounds(coords)) {
					errorMsg = 'Error: Invalid coordinates; Ensure address is inside King County.';
					break;
				}
			}
		}

		if (errorMsg != '') {
			setErrorMsg(errorMsg);
			return true;
		}
		return false;
	}

	return (
		<div className={clsx(styles.destinationForm)}>
			<p className={clsx(styles.link)} onClick={() => flyToAddress('Bellevue, Washington')}>Seattle and Bellevue Area</p>
			
			<AddressListInput
				items={newStops}
				setItems={setNewStops}
				geolocation={geolocation}
				mapFocusPoint={mapFocusPoint}
			/>
			
			{/*} DEPRICATED
			<div>
				<AddressInput 
					placeholder='Enter starting point...'
					value={origin}
					onChange={(e) => setOrigin(e.target.value)}
					flyTo={flyToAddress}
					onFocus={() => setAddressInputFocus('origin')}
					onBlur={() => setAddressInputFocus('')}
				/>
				<InsertLocationButton setValue={setOrigin} focusName={'origin'}/>
				<br/>
				<AddressInput 
					placeholder='Enter destination...'
					value={destination}
					onChange={(e) => setDestination(e.target.value)}
					flyTo={flyToAddress}
					onFocus={() => setAddressInputFocus('destination')}
					onBlur={() => setAddressInputFocus('')}
				/>
				<InsertLocationButton setValue={setDestination} focusName={'destination'}/>
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
			{*/}

			<button
				onClick={() => submitRoute()}
				disabled={isLoading}
				className={clsx(styles.submitRouteButton, isLoading ? styles.loading : '')}
			>
				{isLoading ? 'Calculating...' : 'Get Safe Directions'}
			</button>
			<p style={{color: 'red'}}>{errorMsg}</p>
		</div>
	)
}
