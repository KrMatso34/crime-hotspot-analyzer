import React, { useState } from 'react';

import { geocodeAddress, fetchRoute } from '@services/geocode'

import AddressInput from './components/AddressInput/AddressInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

export default function DestinationForm({ setCamCoords, setRoute }) {
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');

	const flyToAddress = async () => {
		try {
			const result = await geocodeAddress(destination || origin);

			// TODO: Error handling if geocode service cannot find location
			if (!result.lat || !result.lon) return; 

			setCamCoords([result.lat, result.lon], result);
		} catch (err) {
			console.error(err);
		}
	}

	const submitRoute = async () => {
		try {
			if (!destination || !origin) return;

			// TODO: Error handling if geocode service cannot find route
			const route = await fetchRoute(origin, destination);

			setRoute(route);
		} catch (err) {
			console.error(err);
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

			<button onClick={submitRoute}>Get Safe Directions</button>
		</div>
	)
}
