import React, { useState } from 'react';

import styles from './PageStyleToggle.module.css';
import clsx from 'clsx';

export default function PageStyleToggle() {
	
	
	return (
		<button className={clsx(styles.pageStyleToggle)}>
			Change style
		</button>
	)
}
