import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getRiskLevel } from '@services/riskScoring';

/**
 * RiskVisualizationLayer Component
 * Displays crime hotspots and route risk as visual overlays on the map
 */
export default function RiskVisualizationLayer({ 
  routeCoordinates = [],
  riskScore = 0,
  crimeHotspots = [],
  visible = true 
}) {
  const map = useMap();
  const [layers, setLayers] = React.useState([]);

  React.useEffect(() => {
    if (!visible) {
      layers.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      setLayers([]);
      return;
    }

    const newLayers = [];

    // Add crime hotspot markers
    if (crimeHotspots && crimeHotspots.length > 0) {
      crimeHotspots.forEach(hotspot => {
        const riskLevel = getRiskLevel(hotspot.intensity);
        
        // Create a circle marker representing the hotspot
        const marker = L.circleMarker([hotspot.lat, hotspot.lon], {
          radius: 6 + (hotspot.intensity * 8), // Size based on intensity
          color: riskLevel.color,
          fillColor: riskLevel.color,
          fillOpacity: 0.5 + (hotspot.intensity * 0.3),
          weight: 2,
          opacity: 0.8
        });

        // Add popup with crime information
        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px;">
            <strong style="font-size: 14px; color: ${riskLevel.color}">Crime Hotspot</strong>
            <div style="margin-top: 6px; color: #666;">
              <p style="margin: 4px 0;"><strong>Risk:</strong> ${riskLevel.label}</p>
              <p style="margin: 4px 0;"><strong>Incidents:</strong> ${hotspot.crimeCount}</p>
              ${hotspot.crimeTypes ? `<p style="margin: 4px 0;"><strong>Types:</strong> ${hotspot.crimeTypes.join(', ')}</p>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        newLayers.push(marker);
      });
    }

    // Draw route with risk coloring
    if (routeCoordinates && routeCoordinates.length > 1) {
      const riskLevel = getRiskLevel(riskScore);
      
      // Draw segments with gradient effect based on risk
      for (let idx = 0; idx < routeCoordinates.length - 1; idx++) {
        const coord = routeCoordinates[idx];
        const nextCoord = routeCoordinates[idx + 1];
        
        // Calculate segment-specific risk with slight variation
        const segmentRisk = riskScore + (Math.random() - 0.5) * 0.1;
        const segmentLevel = getRiskLevel(Math.max(0, Math.min(1, segmentRisk)));
        
        const segment = L.polyline([coord, nextCoord], {
          color: segmentLevel.color,
          weight: 6,
          opacity: 0.6 + (segmentRisk * 0.3),
          lineCap: 'round',
          lineJoin: 'round',
          className: 'risk-polyline'
        });

        segment.addTo(map);
        newLayers.push(segment);
      }
    }

    setLayers(newLayers);

    return () => {
      newLayers.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [routeCoordinates, visible, riskScore, crimeHotspots, map]);

  return null;
}
