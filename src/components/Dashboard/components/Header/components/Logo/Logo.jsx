import React, { useState } from 'react';

import styles from './Logo.module.css';
import clsx from 'clsx';

export default function Logo() {
	
	return (
		<span className={clsx(styles.logo)}>
			KAGS
		</span>
	)
}
