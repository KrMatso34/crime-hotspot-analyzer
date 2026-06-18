
import React from 'react';
import { useTheme } from '../../../ThemeProvider/ThemeProvider';

import styles from './SwitchThemeButton.module.css';
import clsx from 'clsx';

export function SwitchThemeButton() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button 
			onClick={toggleTheme}
			className={clsx(styles.switchThemeButton)}
		>
			Change Theme
		</button>
	);
};
