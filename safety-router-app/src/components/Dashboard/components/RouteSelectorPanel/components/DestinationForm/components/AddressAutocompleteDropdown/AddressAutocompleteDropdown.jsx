import React, { useState, useEffect, useRef } from "react";

import { useSpecialPoints } from "@/src/components/Dashboard/Dashboard";
import { useAccountInfo } from "@/src/components/Dashboard/Dashboard";

import clsx from 'clsx';
import styles from './AddressAutocompleteDropdown.module.css'

import { LocateFixed, Map, House } from 'lucide-react'


/*
Notes about using Photon API:
 - more relaxed for search-as-you type calls
 - for production: host photon instance via docker

*/

const globalAddressCache = {};

export const AddressAutocompleteDropdown = ({
	query, setQuery, 
	isOpen, setIsOpen, 
	onSelect = () => {}
}) => {
	const [suggestions, setSuggestions] = useState([]);
	const dropdownRef = useRef(null);
	const [lastSelected, setLastSelected] = useState('');

	const {geolocation, mapFocusPoint} = useSpecialPoints();
	const {savedAddress} = useAccountInfo();


	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Debounce API calls to prevent overwhelming the server
	useEffect(() => {
		if (query.length < 3) {
			setSuggestions([]);
			return;
		}

		if (query == lastSelected) return;

		if (globalAddressCache[query]) {
			setSuggestions(globalAddressCache[query]);
			setIsOpen(false)
			return;
		}


		const controller = new AbortController(); // Make sure most recent call has highest priority
		const { signal } = controller;

		const delayDebounceTimer = setTimeout(async () => {
			try {
				// Using Photon API (OSM backed)
				const response = await fetch(
					`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=47.6062&lon=122.3321&lang=en`, // &lat=34.0522&lon=-118.2437  &lang=en
					{ signal }
				);
				const data = await response.json();

				// Photon returns GeoJSON
				setSuggestions(data.features || []);
				setIsOpen(true);
				

				globalAddressCache[query] = data.features || [];
			} catch (error) {
				if (error.name !== 'AbortError') {
					console.error("Error fetching address data:", error);
					throw error;
				}
			}
		}, 400); // 400ms delay

		return () => {
			clearTimeout(delayDebounceTimer);
			controller.abort();
		}
	}, [query]);

	const formatAddress = (properties) => {
		const { name, street, city, state, country } = properties;
		return [name || street, city, state, country].filter(Boolean).join(", ");
	};

	const handleSelect = (feature) => {
		const fullAddress = formatAddress(feature.properties);
		selectItem(fullAddress)

		// You can also access coordinates here!
		//const [lng, lat] = feature.geometry.coordinates;
		//console.log("Selected Coordinates:", { lat, lng });
		//onSelect(lat, lng)
	};

	const selectItem = (value) => {
		setQuery(value);
		setIsOpen(false);
		setLastSelected(value);
	}

	useEffect(() => {
		if (!isOpen) {
			setSuggestions([])
		}
	}, [isOpen]);

	const quickInserts = [
		...(geolocation.length > 0 ? [{
			value: `${geolocation[0]}, ${geolocation[1]}`,
			text: 'Your Location',
			icon: <LocateFixed/>
		}] : []),
		...(mapFocusPoint.length > 0 ? [{
			value: `${mapFocusPoint[0]}, ${mapFocusPoint[1]}`,
			text: 'Selected Map Point',
			icon: <Map/>
		}] : []),
		...(savedAddress.length > 0 ? [{
			value: `${savedAddress}`,
			text: 'Home',
			icon: <House/>
		}] : []),
	]


	return (
		<div ref={dropdownRef}>
			{isOpen && (suggestions.length > 0 || quickInserts.length > 0) && (
				<ul className={clsx(styles.suggestionList)}>
					{(suggestions.length > 0) && suggestions.map((feature, index) => (
						<li
							key={index}
							onClick={() => handleSelect(feature)}
							className={clsx(styles.suggestionButton)}
						>
							{formatAddress(feature.properties)}
						</li>
					))}
					{(suggestions.length == 0 && quickInserts.length > 0) && quickInserts.map(({value, text, icon}, index) => (
						<li
							key={index}
							onClick={() => selectItem(value)}
							className={clsx(styles.suggestionButton)}
						>
							{icon}
							<span>{text}</span>
						</li>
					))
						


					}
				</ul>
			)}
		</div>
	);
};
