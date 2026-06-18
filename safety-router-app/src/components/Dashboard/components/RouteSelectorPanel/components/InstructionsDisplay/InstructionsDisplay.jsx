import React, { useState, useEffect } from 'react';

import { CornerUpRight, CornerUpLeft, MoveUp } from 'lucide-react';

import styles from './InstructionsDisplay.module.css';
import clsx from 'clsx';

function InstructionCard({index, distance, text, time}) {

	return (
		<div className={clsx(styles.instructionCard)}>
			<div className={clsx(styles.instructionIcon)}>
				{text.startsWith('continue') ? <MoveUp/> : ''}
				{text.startsWith('turn left') ? <CornerUpLeft/> : ''}
				{text.startsWith('turn right') ? <CornerUpRight/> : ''}
			</div>
			<div>
				<span>Step {index+1}: </span>
				<br/>
				<span className={clsx(styles.instructionDescription)}>{text.charAt(0).toUpperCase() + text.slice(1)}</span>
			</div>
		</div>
	)
}

export default function InstructionsDisplay({ instructions }) {

	return (
		<div>
			<h2>Instructions</h2>
			<div>
				{instructions.map(((instruction, index) => 
					<InstructionCard key={index} index={index} {...instruction}/>
				))}
			</div>
		</div>
	)
}
