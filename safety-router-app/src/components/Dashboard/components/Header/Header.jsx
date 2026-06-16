import React, { useState } from 'react';

import Logo from './components/Logo/Logo';
import { AccessAccountButton } from './components/AccessAccountButton/AccessAccountButton';
import { AccountForm } from './components/AccountForm/AccountForm';
import { SwitchThemeButton } from './components/SwitchThemeButton/SwitchThemeButton';


import styles from './Header.module.css';
import clsx from 'clsx';


export default function Header({children}) {
	const [accountModalOpen, setAccountModalOpen] = useState(false);

	return (
		<>
		<div className={clsx(styles.header)}>
			<div className={clsx(styles.content)}>
				<Logo/>
				<div className={clsx(styles.buttonContainer)}>
					<AccessAccountButton onClick={() => setAccountModalOpen(true)}/>
					<SwitchThemeButton/>
				</div>
				<AccountForm
					isOpen={accountModalOpen}
					setIsOpen={setAccountModalOpen}
				/>
				
			</div>
		</div>
		{children}
		</>
	)
}
