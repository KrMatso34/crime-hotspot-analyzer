import { useEffect, useState } from 'react';
import { Modal } from '../Modal/Modal';

import { useAccountInfo } from '@/src/components/Dashboard/Dashboard';

import styles from './AccountForm.module.css'
import clsx from 'clsx'

function LogInForm({setFormState}) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setErrorMsg('');
	}, [username, password]);

	const accountInfo = useAccountInfo();

	const submitLogIn = async (username, password) => {
		setLoading(true);

		if (username.length == 0 || password.length == 0) {
			setErrorMsg('Username and/or password cannot be empty.');
			return;
		}

		try {
			const res = await fetch('http://localhost:4000/api/accounts/login/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({username, password})
			});
			const data = await res.json();

			if (!data.success) {
				const msg = 'Password or username is incorrect';
				setErrorMsg(msg);
				throw new Error(msg);
			}

			const {user} = data;

			setErrorMsg('');
			if (user.savedAddress && user.savedAddress.length > 0) {
				accountInfo.setSavedAddress(user.savedAddress)
			}
			
			accountInfo.logIn(user.id);

			setFormState('info');

		} catch (err) {
			console.error('Log In failed', err);
		} finally {
			setLoading(false);
		}
	}

	return <>
		<div>
			<div className={clsx(styles.formContainer)}>
				<input
					type='text'
					placeholder='Email'
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<input
					type='password'
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			<div>
				<button
					disabled={loading}
					onClick={() => {submitLogIn(username, password)}}
				>
					Log In
				</button>
				<span className={clsx(styles.error)}>{errorMsg}</span>
			</div>
		</div>
		<div className={clsx(styles.switchFormText)}>
			<span>
				&middot; Don't have an account? <button className={clsx(styles.inlineButton)} onClick={() => {setFormState('signup')}}>Sign Up</button>
			</span>
		</div>
	</>
}

function SignUpForm({setFormState}) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [loading, setLoading] = useState(false);

	const accountInfo = useAccountInfo();

	useEffect(() => {
		setErrorMsg('');
	}, [username, password]);

	const submitSignUp = async (username, password) => {
		setLoading(true);
		if (username.length == 0 || password.length == 0) {
			setErrorMsg('Username and/or password cannot be empty.');
			return;
		}

		try {
			const res = await fetch('http://localhost:4000/api/accounts/signup/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({username, password})
			});
			const data = await res.json();

			if (!data.success) {
				const msg = 'Account with username already exists';
				setErrorMsg(msg);
				throw new Error(msg)
			}

			setErrorMsg('');
			accountInfo.logIn(data.id);

			setFormState('info');
			
		} catch (err) {
			console.error('Sign up failed', err);
		} finally {
			setLoading(false);
		}
	}

	return <>
		<div>
			<div className={clsx(styles.formContainer)}>
				<input
					type='text'
					placeholder='Email'
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<input
					type='password'
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			<div>
				<button
					disabled={loading}
					onClick={() => {submitSignUp(username, password)}}
				>
					Sign Up
				</button>
				<span className={clsx(styles.error)}>{errorMsg}</span>
			</div>
		</div>
		<div className={clsx(styles.switchFormText)}>
			<span>
				&middot; Already have an account? <button className={clsx(styles.inlineButton)} onClick={() => {setFormState('login')}}>Log In</button>
			</span>
		</div>
	</>
}

function InfoForm({setFormState}) {
	const accountInfo = useAccountInfo();
	
	const [homeAddress, setHomeAddress] = useState(accountInfo.savedAddress);
	const [saveMessage, setSaveMessage] = useState('');

	const signOut = () => {
		setFormState('login')
		accountInfo.logOut();
	}

	const handleUpdateSavedAddresses = async () => {
		try {
			console.log(accountInfo);
			const res = await fetch(`http://localhost:4000/api/accounts/${accountInfo.id}/address`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({savedAddress: homeAddress})
			});
			const data = await res.json();

			if (!data.success || !res.ok) {
				setSaveMessage('Error applying changes.')
				throw Error('Account not found');
			}

			accountInfo.setSavedAddress(homeAddress);
			setSaveMessage('Saved!');

		} catch (err) {
			console.error('Update savaed address failed!', err);
		}
		
	}

	return <>
		<div>
			<h3>Saved addresses</h3>
			<input
				value={homeAddress}
				onChange={(e) => setHomeAddress(e.target.value)}
			/>
			<button
				onClick={handleUpdateSavedAddresses}
			>Save Changes</button>
			<span>{saveMessage}</span>
		</div>
		<button className={clsx(styles.signOutButton)} onClick={signOut}>Sign out</button>
	</>
}

export function AccountForm({ isOpen, setIsOpen }) {
	const [formState, setFormState] = useState('login');

	const titles = {
		login: 'Log In',
		signup: 'Sign Up',
		info: 'Account Info'
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			title={titles[formState]}
		>
			{formState == 'login' && <LogInForm 
				setFormState={setFormState}
			/>}
			{formState == 'signup' && <SignUpForm 
				setFormState={setFormState}
			/>}
			{formState == 'info' && <InfoForm
				setFormState={setFormState}
			/>}
		</Modal>
	)
}