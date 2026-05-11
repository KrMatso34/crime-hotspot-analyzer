import React from 'react';
import { useNotificationListener } from './useNotification';
import styles from './NotificationCard.module.css';
import clsx from 'clsx'

export const NotificationCard = () => {
	const notifications = useNotificationListener();

	return (
		<div className={clsx(styles.overlayStyle)}>
			{notifications.map((n) => (
				<div 
					key={n.id} 
					style={{color: 'yellow'}}
				>
					{n.message}
				</div>
			))}
		</div>
	);
};

// clsx(styles.notifStyle)
// , styles[n.type] ?? ''