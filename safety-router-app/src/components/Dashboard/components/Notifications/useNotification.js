import { useState, useEffect } from 'react';

const listeners = new Set();

export const alert = {
  	show: (message, type = 'warning', duration = 3000) => {
		listeners.forEach((callback) => callback({ message, type, duration }));
	}
};

export const useNotificationListener = () => {
	const [notifs, setNotifs] = useState([]);

	useEffect(() => {
		const addNotif = (details) => {
			const id = Date.now();
			setNotifs((prev) => [...prev, { ...details, id }]);

			setTimeout(() => {
				setNotifs((prev) => prev.filter((n) => n.id !== id));
			}, details.duration);
		};

		listeners.add(addNotif);
		return () => listeners.delete(addNotif);
	}, []);

	return notifs;
};