import { useState } from 'react';
import SearchBox from './components/SearchBox/SearchBox';
import { makeRoute } from '../../services/navigation' 

import styles from './MapView.module.css'
import clsx from 'clsx';

function EntryRow({keyName, value, evenRow=false}) {
	return (
		<>
			<div className={clsx(styles.tableGridCell, evenRow ? styles.tableGridCellEven : '')}>
				<span>{keyName}</span>
			</div>
			<div className={clsx(styles.tableGridCell, evenRow ? styles.tableGridCellEven : '')}>
				<span>{JSON.stringify(value)}</span>
			</div>
		</>
	)
}

function Table({title, data}) {
	const keys = Object.keys(data ?? {});

	return (
		<>
			<h2>{title}</h2>
			<div className={styles.tableGrid}>
				{
					keys.map((field, index) => 
						<EntryRow 
							key={field} 
							keyName={field} 
							value={data[field]}
							evenRow={index % 2 == 0}
						/>
					)
				}
			</div>
		</>
	)
}

export default function MapView() {
	const [mapData, setMapData] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [routeData, setRouteData] = useState({});

	const onResult = (result) => {
		setMapData(result);
		setIsLoading(false);
	}

	const getRoute = async () => {
		const res = await makeRoute({
			destination: {
				lat: mapData.lat,
				lon: mapData.lon,
			},
		});

		setRouteData(res);
	}
	

	return (
		<>
			<h1>Map View</h1>
			<div>
				<div>
					<span>
						Destination: 
					</span>
					<SearchBox onSubmit={() => setIsLoading(true)} onResult={onResult}/>
				</div>
			</div>
			
			
			<div>
				{isLoading ? (
					<>
						<p>Loading...</p>
					</>
				) : (
					<>
						<button onClick={getRoute}>Get Route</button>
						<Table title='Loaction Tags' data={mapData}/>
						
						{routeData ? (
							<>
								<Table title='Route info' data={routeData}/>
							</>
						) : (<></>) 

						}
						
					</>
					
				)}
			</div>
		</>
	)
}
