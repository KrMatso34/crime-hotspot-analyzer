import React, { useState } from 'react';

import styles from './AddressInput.module.css';
import clsx from 'clsx';

export default function AddressInput({flyTo, ...props}) {
	
	return (
		<div>
			<input 
				className={clsx(styles.addressInput)}
				{...props}
			/>
			<button 
				disabled={props.value.length==0}
				onClick={() => flyTo(props.value)}
			>
				Show on Map
			</button>
		</div>
	)
}
