import React, { useState } from 'react';

import { geocodeAddress, fetchRoute } from '@services/geocode';

import AddressInput from './components/AddressInput/AddressInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

export default function DestinationForm({ setCamCoords, setRouteCoords }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState(['']); // array of stop addresses
  const [isLoading, setIsLoading] = useState(false);

  // Add a new empty stop input, limit to 5 stops
  const addStop = () => {
    if (stops.length >= 5) {
      alert('Maximum 5 stops allowed');
      return;
    }
    setStops([...stops, '']);
  };

  // Remove a specific stop
  const removeStop = (index) => {
    if (stops.length <= 1) return; // keep at least one stop box
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
  };

  // Update a stop value
  const updateStop = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const flyToAddress = async (address) => {
    try {
      if (!address) return;
      const result = await geocodeAddress(address);
      if (!result?.lat || !result?.lon) return;
      setCamCoords([parseFloat(result.lat), parseFloat(result.lon)], result);
    } catch (err) {
      console.error(err);
    }
  };

  const submitRoute = async () => {
    setIsLoading(true);
    try {
      // Build full list: origin → stops → destination
      const points = [
        origin.trim(),
        ...stops.map(s => s.trim()).filter(Boolean),
        destination.trim()
      ].filter(Boolean);

      if (points.length < 2) {
        alert('Please enter at least a start and destination');
        return;
      }

      let fullRoute = [];

      // Chain legs: origin → stop1 → stop2 → ... → destination
      for (let i = 0; i < points.length - 1; i++) {
        const from = points[i];
        const to = points[i + 1];
        const leg = await fetchRoute(from, to);

        // Append all points except the last one of this leg (to avoid duplicates)
        fullRoute = [...fullRoute, ...leg.slice(0, -1)];
      }

      // Add the final destination point
      const lastLeg = await fetchRoute(points[points.length - 2], points[points.length - 1]);
      fullRoute.push(lastLeg[lastLeg.length - 1]);

      setRouteCoords(fullRoute);

      // Fly to starting point
      const startResult = await geocodeAddress(origin);
      if (startResult?.lat && startResult?.lon) {
        setCamCoords([parseFloat(startResult.lat), parseFloat(startResult.lon)], startResult);
      }
    } catch (err) {
      console.error(err);
      alert('Could not calculate route');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx(styles.destinationForm)}>
      <p>Seattle and Bellevue Area</p>

      <div>
        {/* Starting point */}
        <AddressInput
          placeholder="Enter starting point..."
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          flyTo={() => flyToAddress(origin)}
        />

        <br />

        {/* Destination */}
        <AddressInput
          placeholder="Enter destination..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          flyTo={() => flyToAddress(destination)}
        />

        <br />

        {/* Stops section */}
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Add stops (optional)</h4>

          {stops.map((stop, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <AddressInput
                placeholder={`Stop ${index + 1}...`}
                value={stop}
                onChange={(e) => updateStop(index, e.target.value)}
                flyTo={() => flyToAddress(stop)}
              />

              {stops.length > 1 && (
                <button
                  onClick={() => removeStop(index)}
                  style={{
                    marginLeft: '10px',
                    backgroundColor: '#ff4d4d',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addStop}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            + Add another stop
          </button>
        </div>
      </div>

      <button
        onClick={submitRoute}
        disabled={isLoading}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: isLoading ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Calculating...' : 'Get Safe Directions'}
      </button>
    </div>
  );
}