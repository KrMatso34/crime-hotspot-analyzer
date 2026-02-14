import React, { useState } from 'react';

import { geocodeAddress } from '@services/geocode'

import AddressInput from './components/AddressInput/AddressInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

export default function DestinationForm({ setCamCoords }) {
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');

	const submitRoute = async () => {
		const result = await geocodeAddress(destination || origin);

		if (!result.lat || !result.lon) return; // TODO: Error handling if geocode service cannot find location

		setCamCoords([result.lat, result.lon], result);
	}

	return (
		<div className={clsx(styles.destinationForm)}>
			<p>Seattle and Bellevue Area</p>

			<div>
				<AddressInput 
					placeholder='Enter starting point...'
					value={origin}
					onChange={(e) => setOrigin(e.target.value)}
				/>
				<br/>
				<AddressInput 
					placeholder='Enter destination...'
					value={destination}
					onChange={(e) => setDestination(e.target.value)}
				/>
			</div>

			<button onClick={submitRoute}>Get Safe Directions</button>
		</div>
	)
}
