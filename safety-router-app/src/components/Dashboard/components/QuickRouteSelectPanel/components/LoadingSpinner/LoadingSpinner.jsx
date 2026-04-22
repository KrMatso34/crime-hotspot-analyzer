import React from 'react';
import styles from './LoadingSpinner.module.css';

export function LoadingSpinner(props) {
	return <div className={styles.loadingSpinner} {...props}></div>
}