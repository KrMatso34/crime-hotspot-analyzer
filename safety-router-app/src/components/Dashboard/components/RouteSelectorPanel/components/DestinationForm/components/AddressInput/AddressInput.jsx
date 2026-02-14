import React, { useState } from 'react';

import styles from './AddressInput.module.css';
import clsx from 'clsx';

export default function AddressInput(props) {
	
	return (
		<input 
			className={clsx(styles.addressInput)}
			{...props}
		/>
	)
}
