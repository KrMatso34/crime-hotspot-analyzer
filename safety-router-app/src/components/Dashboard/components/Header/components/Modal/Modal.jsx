import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css'

export const Modal = ({ isOpen, onClose, title, children }) => {
	
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape') onClose();
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return createPortal(
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
			<div className={styles.modalHeader}>
				<h2>{title}</h2>
				<button className={styles.modalCloseBtn} onClick={onClose}>
					&times;
				</button>
			</div>
			<div className={styles.modalBody}>
				{children}
			</div>
			</div>
		</div>,
		document.body
	);
};
