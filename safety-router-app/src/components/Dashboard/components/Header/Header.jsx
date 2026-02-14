import React, { useState } from 'react';

import Logo from './components/Logo/Logo';
import PageStyleToggle from './components/PageStyleToggle/PageStyleToggle';

import styles from './Header.module.css';
import clsx from 'clsx';;

export default function Header() {
	

	return (
		<div className={clsx(styles.header)}>
			<div className={clsx(styles.content)}>
				<Logo/>
				<PageStyleToggle/>
			</div>
		</div>
	)
}
