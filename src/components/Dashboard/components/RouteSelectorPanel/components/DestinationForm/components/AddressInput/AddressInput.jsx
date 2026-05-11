import React from 'react';

import styles from './AddressInput.module.css';

export default function AddressInput({flyTo, ...props}) {
	
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
			<input 
				className={styles.addressInput}
				type="text"
				autoComplete="off"
				spellCheck="false"
				{...props}
			/>
			<button 
				type="button"
				disabled={!props.value || props.value.length === 0}
				onClick={() => flyTo(props.value)}
				className={styles.showButton}
			>
				Show on Map
			</button>
		</div>
	)
}
