import React from 'react';

import clsx from 'clsx';
import styles from './TransportationSelector.module.css';

import { Car, Footprints } from 'lucide-react';



export function TransportationSelector({transportationMethod, setTransportationMethod}) {
	function TransportationButton({ children, label }) {
		const selected = label == transportationMethod;

		return <button
			className={clsx(
				styles.transportationButton,
				selected && styles.selected
			)}
			onClick={() => setTransportationMethod(label)}
		>{children}</button>
	}

	return (
		<div
			className={clsx(styles.transportationSelector)}
		>
			<h2>Transportation Method</h2>
			
			<div
				className={clsx(styles.transportationButtons)}
			>
				<TransportationButton label='car'><Car/></TransportationButton>
				<TransportationButton label='foot'><Footprints/></TransportationButton>
			</div>
		</div>
	)
}