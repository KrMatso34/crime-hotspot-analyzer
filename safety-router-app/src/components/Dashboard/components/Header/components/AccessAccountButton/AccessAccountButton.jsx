
import styles from './AccessAccountButton.module.css';
import clsx from 'clsx';

import { useAccountInfo } from '@/src/components/Dashboard/Dashboard';

export function AccessAccountButton({ onClick }) {
	const {isLoggedIn} = useAccountInfo();
	
	return (
		<button onClick={onClick} className={clsx(styles.accessAccountButton)}>
			{isLoggedIn ? 'Account' : 'Log In'}
		</button>
	)
}
