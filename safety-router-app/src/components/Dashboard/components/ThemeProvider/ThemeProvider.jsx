// ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) return savedTheme;

		const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return prefersDarkMode ? 'dark' : 'light';
	});

	useEffect(() => {
		localStorage.setItem('theme', theme);
		document.documentElement.setAttribute('data-theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

// Custom hook for easy consumption
export const useTheme = () => {
	const context = useContext(ThemeContext);
	return context;
};