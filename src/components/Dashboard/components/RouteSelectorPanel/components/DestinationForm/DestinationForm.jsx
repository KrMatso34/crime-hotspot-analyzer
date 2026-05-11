import React, { useState, useCallback } from 'react';

import { geocodeAddress, fetchRoute, isLocationValid } from '@services/geocode';
import { calculateRouteRisk } from '@services/riskScoring';

import AddressInput from './components/AddressInput/AddressInput';

import styles from './DestinationForm.module.css';
import clsx from 'clsx';

export default function DestinationForm({ setCamCoords, setRouteCoords, onRouteSelected, crimeHotspots = [] }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState(['']); // array of stop addresses
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Add a new empty stop input, limit to 5 stops
  const addStop = () => {
    if (stops.length >= 5) {
      setError('Maximum 5 stops allowed');
      setTimeout(() => setError(''), 3000);
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
      setError('');
      if (!address) return;
      const result = await geocodeAddress(address);
      if (!result?.lat || !result?.lon) {
        setError('Address not found');
        return;
      }
      
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      // Check if location is in valid area
      if (!isLocationValid(lat, lon)) {
        setError('Location outside Seattle/Bellevue service area');
        return;
      }
      
      setCamCoords([lat, lon], result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not find location');
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitRoute = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Build full list: origin → stops → destination
      const points = [
        origin.trim(),
        ...stops.map(s => s.trim()).filter(Boolean),
        destination.trim()
      ].filter(Boolean);

      if (points.length < 2) {
        setError('Please enter at least a start and destination');
        setIsLoading(false);
        return;
      }

      // Verify all locations are in valid service area
      for (const point of points) {
        try {
          const result = await geocodeAddress(point);
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          
          if (!isLocationValid(lat, lon)) {
            setError(`"${point}" is outside the Seattle/Bellevue service area`);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          setError(`Could not verify location: ${point}`);
          setIsLoading(false);
          return;
        }
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

      // Calculate risk score for the route using crime data
      const riskScore = calculateRouteRisk(fullRoute, crimeHotspots);

      // Fly to starting point
      const startResult = await geocodeAddress(origin);
      if (startResult?.lat && startResult?.lon) {
        setCamCoords([parseFloat(startResult.lat), parseFloat(startResult.lon)], startResult);
      }

      // Notify parent of route selection with risk data
      if (onRouteSelected) {
        onRouteSelected({
          riskAssessment: riskScore,
          distance: null, // Will be set from API
          duration: null  // Will be set from API
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not calculate route');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx(styles.destinationForm)}>
      <p style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Seattle and Bellevue Area</p>

      {error && (
        <div style={{
          padding: '10px 12px',
          marginBottom: '12px',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ff6b6b',
          borderRadius: '6px',
          color: '#d32f2f',
          fontSize: '13px',
          fontWeight: '500',
          animation: 'slideIn 0.3s ease'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Starting point */}
        <AddressInput
          placeholder="Enter starting point..."
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          flyTo={() => flyToAddress(origin)}
        />

        {/* Destination */}
        <AddressInput
          placeholder="Enter destination..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          flyTo={() => flyToAddress(destination)}
        />

        {/* Stops section */}
        <div style={{ marginTop: '8px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600' }}>Add stops (optional)</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stops.map((stop, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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
                      minWidth: '32px',
                      height: '32px',
                      backgroundColor: '#ff4d4d',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addStop}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '6px',
              width: '100%',
              fontSize: '14px',
              fontWeight: '600',
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
          marginTop: '12px',
          padding: '10px 16px',
          backgroundColor: isLoading ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          width: '100%',
        }}
      >
        {isLoading ? 'Calculating...' : 'Get Safe Directions'}
      </button>
    </div>
  );
}