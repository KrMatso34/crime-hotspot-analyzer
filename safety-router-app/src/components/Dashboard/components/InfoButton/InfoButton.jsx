import React, { useState, useEffect, useRef } from 'react';
import styles from './InfoButton.module.css'; 
import clsx from 'clsx';

export const InfoButton = ({ text, children, direction="top" }) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);

	const toggleTooltip = () => {
		setIsOpen((prev) => !prev);
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div className={clsx(styles.infoContainer)} ref={containerRef}>
			<button 
				className={clsx(
					styles.infoButton,
					isOpen ? styles.active : ''
				)}
				onClick={toggleTooltip}
				aria-label="Information"
				aria-expanded={isOpen}
			>
				i
			</button>

			{isOpen && (
				<div className={clsx(styles.infoTooltip, styles["tooltip-" + direction])} role="tooltip">
					<p>{text || children}</p>
					<div className={clsx(styles.tooltipArrow, styles["arrow-" + direction])} />
				</div>
			)}
		</div>
	);
};
