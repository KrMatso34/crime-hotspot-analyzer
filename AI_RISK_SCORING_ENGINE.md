# AI Risk Scoring Engine

The Safety Router App includes an advanced AI-powered risk scoring engine that analyzes locations, routes, and areas to provide safety assessments and recommendations.

## Features

### 1. **Location Risk Analysis**
- Calculates safety scores based on proximity to crime hotspots
- Uses exponential distance decay model
- Accounts for crime intensity and frequency
- Returns score between 0 (safest) and 1 (most dangerous)

### 2. **Route Risk Assessment**
- Analyzes entire routes for safety
- Samples route at intervals for performance optimization
- Provides weighted average risk score
- Integrates with navigation system

### 3. **Risk Level Classification**
Scores are classified into 5 levels:
- **Very Low** (0-0.2): ✓ Safe - Green indicator
- **Low** (0.2-0.4): ○ Generally safe - Light green
- **Medium** (0.4-0.6): ⚠ Moderate caution - Yellow
- **High** (0.6-0.8): ⚠⚠ High caution - Orange
- **Critical** (0.8-1.0): 🚨 Very dangerous - Red indicator

### 4. **Safety Recommendations**
- Dynamic recommendations based on risk score
- Time-of-day considerations
- Day-of-week analysis
- Weather impact assessment
- Real-time factor integration

### 5. **Visual Risk Indicators**
- Color-coded route visualization
- Risk heatmap overlay on map
- Animated risk indicators
- Responsive risk display components

## Components

### RiskAssessment Component
Displays comprehensive risk information with:
- Circular risk score visualization
- Color-coded risk level
- Safety recommendations
- Route statistics (distance, duration)
- Detailed breakdown view

**Usage:**
```jsx
import RiskAssessment from '@components/RiskAssessment/RiskAssessment';

<RiskAssessment 
  riskScore={0.45}
  distance="2.5"
  duration="8"
  showDetailed={true}
  timeOfDay="evening"
/>
```

### RiskVisualizationLayer Component
Renders risk visualization on the map:
- Polyline segments with color-coded risk
- Opacity based on risk intensity
- Smooth animations

**Usage:**
```jsx
import RiskVisualizationLayer from '@components/Map/components/RiskVisualizationLayer/RiskVisualizationLayer';

<RiskVisualizationLayer 
  routeCoordinates={routeCoords}
  riskScore={riskAssessment}
  visible={true}
/>
```

## Services

### riskScoring.js
Core service providing risk calculation functions:

#### `calculateLocationRisk(lat, lon, crimeHotspots)`
Calculates risk score for a specific location
- **Parameters:**
  - `lat`: Latitude
  - `lon`: Longitude
  - `crimeHotspots`: Array of hotspot objects with `{lat, lon, intensity}`
- **Returns:** Risk score (0-1)

#### `calculateRouteRisk(routeCoordinates, crimeHotspots)`
Analyzes entire route for safety
- **Parameters:**
  - `routeCoordinates`: Array of [lat, lon] coordinates
  - `crimeHotspots`: Crime data array
- **Returns:** Average risk score for route

#### `getRiskLevel(score)`
Classifies score into risk level object
- **Returns:** Object with `{min, max, label, color, icon}`

#### `generateRecommendations(riskScore, timeOfDay)`
Generates safety recommendations
- **Parameters:**
  - `riskScore`: Risk score (0-1)
  - `timeOfDay`: 'morning' | 'afternoon' | 'evening' | 'night'
- **Returns:** Array of recommendation strings

#### `calculateDistance(lat1, lon1, lat2, lon2)`
Calculates distance between coordinates using Haversine formula
- **Returns:** Distance in meters

## Hooks

### useRiskScoring()
Custom React hook for managing risk state:

```jsx
import { useRiskScoring } from '@hooks/useRiskScoring';

const {
  routeRiskScore,        // Current route risk score
  locationRiskScores,    // Map of location risks
  crimeHotspots,         // Current hotspot data
  assessRouteRisk,       // Function to assess route
  assessLocationRisk,    // Function to assess location
  updateHotspots,        // Update hotspot data
  clearScores            // Clear all scores
} = useRiskScoring();
```

## Integration

### With Route Selection
When a user selects a route, the app:
1. Calculates route coordinates
2. Calls `calculateRouteRisk()` 
3. Passes score to `RiskAssessment` component
4. Visualizes on map with `RiskVisualizationLayer`

### With Navigation API
The server-side Python script (`get_route.py`) already integrates risk scoring:
- Uses pre-calculated risk scores on route segments
- Returns `riskAssessment` in route response
- Combines with distance and duration data

### Real-Time Updates
The engine can be extended to:
- Fetch real-time crime data from APIs
- Update hotspots automatically
- Recalculate risks as user moves
- Show alerts for new incidents

## Data Structure

### Crime Hotspot Object
```javascript
{
  lat: 47.6101,
  lon: -122.2015,
  intensity: 0.8,        // 0-1, higher = more crime
  type: 'violent',       // Type of crime
  count: 15,             // Number of incidents
  recentDays: 7          // Days for aggregation
}
```

### Risk Assessment Response
```javascript
{
  riskScore: 0.45,
  riskLevel: 'Medium',
  color: '#FFD700',
  recommendations: [
    "Use standard safety precautions",
    "Stay aware of surroundings"
  ],
  distance: "2.5 mi",
  duration: "8 min",
  factors: {
    locationRisk: 0.4,
    timeOfDayRisk: 0.5,
    dayOfWeekRisk: 0.3,
    policePresenceModifier: 0.8
  }
}
```

## Performance Optimization

### Route Sampling
Large routes are sampled at intervals to reduce calculation time:
```javascript
const sampleInterval = Math.max(1, Math.floor(routeCoordinates.length / 20));
```

### Distance Decay Model
Risk decreases exponentially with distance from hotspots:
```javascript
const distanceDecay = Math.exp(-distance / 500); // 500m decay radius
```

### Memoization
React components use `useMemo` to prevent unnecessary recalculations

## Future Enhancements

1. **Machine Learning Integration**
   - Use trained models for better predictions
   - Learn from historical patterns
   - Personalized risk assessment

2. **Real-Time Data**
   - Integration with police department APIs
   - Live incident feeds
   - Current hotspot updates

3. **Advanced Factors**
   - Weather impact on safety
   - Street lighting data
   - Pedestrian traffic patterns
   - Police patrol routes

4. **Route Comparison**
   - Show alternative routes with risk comparison
   - Recommend optimal routes
   - Time-based variations

5. **User Preferences**
   - Custom risk tolerance settings
   - Preferred route types
   - Accessibility requirements

6. **Notifications**
   - Alert users of high-risk areas
   - Send safety updates during navigation
   - Emergency contact integration

## Testing

Example usage in development:
```javascript
import { calculateRouteRisk, getRiskLevel, generateRecommendations } from '@services/riskScoring';

// Create test hotspots
const hotspots = [
  { lat: 47.61, lon: -122.20, intensity: 0.8 },
  { lat: 47.62, lon: -122.21, intensity: 0.6 }
];

// Test route
const route = [
  [47.6101, -122.2015],
  [47.6102, -122.2016],
  [47.6103, -122.2017]
];

// Calculate
const score = calculateRouteRisk(route, hotspots);
const level = getRiskLevel(score);
const recs = generateRecommendations(score, 'evening');

console.log(score, level, recs);
```

## API Integration

The backend (`server/api/navigation/`) already calculates risk scores. To display them:

```javascript
// In DestinationForm or similar component
const response = await fetch('/api/navigation', {
  method: 'POST',
  body: JSON.stringify({
    origin: { lat: 47.61, lon: -122.20 },
    destination: { lat: 47.62, lon: -122.21 },
    preference: 'safest'
  })
});

const route = await response.json();
// route.riskAssessment contains the score
setRouteRiskScore(route.riskAssessment);
```

## Support

For issues or enhancements, refer to the main project repository.
