# KAGS Crime Legend Component - Complete Package

> 🎯 Production-ready crime legend with 90-day time decay  
> Extracted from the KAGS (Crime-Aware Routing) project  
> Ready to implement in any web project

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [React Implementation](#react-implementation)
3. [Vanilla JavaScript Implementation](#vanilla-javascript-implementation)
4. [API Reference](#api-reference)
5. [Customization](#customization)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)
8. [Original Code Reference](#original-code-reference)

---

## ⚡ Zero Dependencies - 100% Plug & Play

Both versions work with **zero external dependencies**:
- **React Version:** Uses only HTML/CSS (no shadcn/ui required)
- **Vanilla JS Version:** Pure JavaScript with inline styles

Choose whichever fits your project. Both are ready to use immediately!

---

## 🚀 Quick Start

### Choose Your Path

**React Project?** → Use the [React Implementation](#react-implementation) section  
**Vanilla JS Project?** → Use the [Vanilla JavaScript](#vanilla-javascript-implementation) section  

---

## ⚛️ React Implementation

### Step 1: Create Component File

Create `src/components/CrimeLegend.jsx`:

```jsx
/**
 * Crime Legend Component with Time Decay (90 Days)
 * Zero dependencies - pure React with inline styles
 * 
 * This legend shows:
 * - Crime severity color coding
 * - Time decay visualization (90-day window)
 * - Incident type breakdown
 */

// ============================================================================
// CRIME TYPE CONFIGURATION
// ============================================================================
const crimeTypeConfig = {
  theft: { label: "Theft", color: "#eab308" },
  assault: { label: "Assault", color: "#dc2626" },
  burglary: { label: "Burglary", color: "#f97316" },
  robbery: { label: "Robbery", color: "#b91c1c" },
  vandalism: { label: "Vandalism", color: "#a855f7" },
  drug: { label: "Drug Activity", color: "#ec4899" },
  vehicle: { label: "Vehicle Crime", color: "#3b82f6" },
  other: { label: "Other", color: "#6b7280" },
};

// ============================================================================
// TIME DECAY CONSTANTS
// ============================================================================

const TIME_DECAY_DAYS = 90; // Your project uses 90-day window

const TIME_DECAY_EXAMPLES = [
  { label: "Recent (0-7 days)", days: 3.5 },
  { label: "1-2 weeks", days: 10 },
  { label: "1 month", days: 30 },
  { label: "2-3 months (90 day max)", days: 75 },
];

// ============================================================================
// UTILITY FUNCTIONS FOR TIME DECAY
// ============================================================================

/**
 * Calculate days since an incident occurred
 */
function calculateDaysSinceIncident(timestamp) {
  const incidentDate = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - incidentDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate opacity based on incident age
 * Linear decay over 90 days: 1.0 → 0.15
 */
function getOpacityForAge(daysSinceIncident) {
  const normalizedAge = Math.min(daysSinceIncident / TIME_DECAY_DAYS, 1);
  const opacity = Math.max(0.15, 1 - normalizedAge);
  return opacity;
}

/**
 * Convert hex color to RGBA with decay applied
 */
function getColorWithDecay(hexColor, daysSinceIncident) {
  const opacity = getOpacityForAge(daysSinceIncident);
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get color directly from crime type with decay
 */
function getCrimeColorWithDecay(crimeType, daysSinceIncident) {
  const colorMap = {
    "bg-yellow-500": "#eab308",
    "bg-red-600": "#dc2626",
    "bg-orange-500": "#f97316",
    "bg-red-700": "#b91c1c",
    "bg-purple-500": "#a855f7",
    "bg-pink-500": "#ec4899",
    "bg-blue-500": "#3b82f6",
    "bg-gray-500": "#6b7280",
  };
  
  const config = crimeTypeConfig[crimeType];
  if (!config) return "rgba(107, 114, 128, 0.5)";
  
  const hexColor = colorMap[config.bgColor];
  return getColorWithDecay(hexColor, daysSinceIncident);
}

// ============================================================================
// CRIME LEGEND COMPONENT
// ============================================================================

/**
 * CrimeLegend Component
 * 
 * @component
 * @example
 * <CrimeLegend 
 *   incidentCounts={{ theft: 245, assault: 68, ... }}
 *   showTimeDecay={true}
 * />
 * 
 * @param {Object} props
 * @param {Object} props.incidentCounts - Crime counts by type
 * @param {boolean} props.showTimeDecay - Show time decay visualization
 */
export function CrimeLegend({ incidentCounts = {}, showTimeDecay = true }) {
  const allCrimeTypes = ["theft", "assault", "burglary", "robbery", "vandalism", "drug", "vehicle", "other"];

  return (
    <div className="space-y-3">
      {/* ===== CRIME SEVERITY SECTION ===== */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            ⚠️ Crime Severity Legend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {allCrimeTypes.map((type) => {
              const config = crimeTypeConfig[type];
              const count = incidentCounts[type] || 0;

              return (
                <div key={type} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  <div className={cn("w-4 h-4 rounded flex-shrink-0", config.bgColor)} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-medium", config.color)}>
                        {config.label}
                      </span>
                      {count > 0 && (
                        <Badge variant="secondary" className="h-5 text-xs px-1.5">
                          {count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== TIME DECAY VISUALIZATION SECTION ===== */}
      {showTimeDecay && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              📅 Time Decay (90 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Crime incidents fade over time. Older incidents appear more transparent.
            </p>

            <div className="space-y-3">
              {TIME_DECAY_EXAMPLES.map((example, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {example.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {example.days === 3.5 ? "Very High" : example.days === 10 ? "High" : example.days === 30 ? "Medium" : "Fading"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {["theft", "assault", "burglary", "robbery"].map((type) => {
                      const config = crimeTypeConfig[type];
                      const decayColor = getCrimeColorWithDecay(type, example.days);

                      return (
                        <div key={type} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">
                            {config.label.slice(0, 3)}
                          </span>
                          <div 
                            className="flex-1 h-6 rounded-sm border border-muted-foreground/20"
                            style={{ backgroundColor: decayColor }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
              <p>• <strong>Bright colors</strong> = Recent incidents (high concern)</p>
              <p>• <strong>Faded colors</strong> = Older incidents (low concern)</p>
              <p>• <strong>Invisible</strong> = Beyond 90-day window</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const CrimeDecayUtils = {
  TIME_DECAY_DAYS,
  calculateDaysSinceIncident,
  getOpacityForAge,
  getColorWithDecay,
  getCrimeColorWithDecay,
  crimeTypeConfig,
};
```

### Step 2: Use in Your Component

```jsx
import { CrimeLegend } from './components/CrimeLegend';

function Dashboard() {
  const [incidents, setIncidents] = useState({});

  useEffect(() => {
    fetch('/api/crime-stats')
      .then(res => res.json())
      .then(data => setIncidents(data.incidents));
  }, []);

  return (
    <div>
      <CrimeLegend 
        incidentCounts={incidents}
        showTimeDecay={true}
      />
    </div>
  );
}

export default Dashboard;
```

---

## 🌐 Vanilla JavaScript Implementation

### Step 1: Create HTML File

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KAGS Crime Legend</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 20px;
      color: #1f2937;
    }

    #crime-legend {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 KAGS Crime Legend</h1>
    <div id="crime-legend"></div>
  </div>

  <script>
    // ====================================================================
    // KAGS Crime Legend - Vanilla JavaScript
    // ====================================================================

    const CrimeLegendVanilla = (() => {
      const TIME_DECAY_DAYS = 90;
      
      const CRIME_TYPE_CONFIG = {
        theft: { label: "Theft", color: "#eab308", displayColor: "text-yellow-600" },
        assault: { label: "Assault", color: "#dc2626", displayColor: "text-red-600" },
        burglary: { label: "Burglary", color: "#f97316", displayColor: "text-orange-600" },
        robbery: { label: "Robbery", color: "#b91c1c", displayColor: "text-red-700" },
        vandalism: { label: "Vandalism", color: "#a855f7", displayColor: "text-purple-600" },
        drug: { label: "Drug Activity", color: "#ec4899", displayColor: "text-pink-600" },
        vehicle: { label: "Vehicle Crime", color: "#3b82f6", displayColor: "text-blue-600" },
        other: { label: "Other", color: "#6b7280", displayColor: "text-gray-600" },
      };

      const TIME_DECAY_EXAMPLES = [
        { label: "Recent (0-7 days)", days: 3.5, intensity: "Very High" },
        { label: "1-2 weeks", days: 10, intensity: "High" },
        { label: "1 month", days: 30, intensity: "Medium" },
        { label: "2-3 months (90 day max)", days: 75, intensity: "Fading" },
      ];

      function getOpacityForAge(daysSinceIncident) {
        const normalizedAge = Math.min(daysSinceIncident / TIME_DECAY_DAYS, 1);
        const opacity = Math.max(0.15, 1 - normalizedAge);
        return opacity;
      }

      function getColorWithDecay(hexColor, daysSinceIncident) {
        const opacity = getOpacityForAge(daysSinceIncident);
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }

      function getCrimeColorWithDecay(crimeType, daysSinceIncident) {
        const config = CRIME_TYPE_CONFIG[crimeType];
        if (!config) return "rgba(107, 114, 128, 0.5)";
        return getColorWithDecay(config.color, daysSinceIncident);
      }

      function createCrimeSeveritySection(incidentCounts = {}) {
        const allTypes = Object.keys(CRIME_TYPE_CONFIG);
        
        let html = `
          <div style="background-color: rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <h3 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">⚠️ Crime Severity Legend</h3>
            <div style="display: grid; gap: 8px;">
        `;

        allTypes.forEach(type => {
          const config = CRIME_TYPE_CONFIG[type];
          const count = incidentCounts[type] || 0;

          html += `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.05)'" onmouseout="this.style.backgroundColor='transparent'">
              <div style="width: 16px; height: 16px; border-radius: 4px; background-color: ${config.color}; flex-shrink: 0;"></div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 12px; font-weight: 500; color: #1f2937;">${config.label}</span>
                  ${count > 0 ? `<span style="display: inline-flex; background-color: #f3f4f6; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; color: #374151;">${count}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        });

        html += `</div></div>`;
        return html;
      }

      function createTimeDecaySection() {
        let html = `
          <div style="background-color: rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <h3 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">📅 Time Decay (90 Days)</h3>
            <p style="margin-bottom: 12px; font-size: 12px; color: #6b7280;">Crime incidents fade over time. Older incidents appear more transparent.</p>
            <div style="display: grid; gap: 16px;">
        `;

        TIME_DECAY_EXAMPLES.forEach((example, idx) => {
          html += `
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 500; color: #6b7280;">${example.label}</span>
                <span style="font-size: 12px; color: #6b7280;">${example.intensity}</span>
              </div>
              <div style="display: grid; gap: 4px;">
          `;

          ["theft", "assault", "burglary", "robbery"].forEach(type => {
            const config = CRIME_TYPE_CONFIG[type];
            const decayColor = getCrimeColorWithDecay(type, example.days);

            html += `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; color: #6b7280; width: 40px; text-align: right;">${config.label.slice(0, 3)}</span>
                <div style="flex: 1; height: 24px; border-radius: 4px; border: 1px solid rgba(0, 0, 0, 0.1); background-color: ${decayColor};"></div>
              </div>
            `;
          });

          html += `</div></div>`;
        });

        html += `
            </div>
            <div style="padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; display: grid; gap: 4px;">
              <p style="margin: 0;">• <strong>Bright colors</strong> = Recent incidents (high concern)</p>
              <p style="margin: 0;">• <strong>Faded colors</strong> = Older incidents (low concern)</p>
              <p style="margin: 0;">• <strong>Invisible</strong> = Beyond 90-day window</p>
            </div>
          </div>
        `;

        return html;
      }

      return {
        render: function(selector, incidentCounts = {}, options = {}) {
          const { showTimeDecay = true } = options;
          const container = document.querySelector(selector);
          
          if (!container) {
            console.error(`Element not found: ${selector}`);
            return;
          }

          let html = `<div style="display: grid; gap: 12px;">`;
          html += createCrimeSeveritySection(incidentCounts);
          if (showTimeDecay) html += createTimeDecaySection();
          html += `</div>`;

          container.innerHTML = html;
        },

        update: function(selector, incidentCounts = {}) {
          this.render(selector, incidentCounts);
        },

        utils: {
          getOpacityForAge,
          getColorWithDecay,
          getCrimeColorWithDecay,
          TIME_DECAY_DAYS,
          CRIME_TYPE_CONFIG,
        },
      };
    })();

    // Usage
    const incidentCounts = {
      theft: 245,
      assault: 68,
      burglary: 66,
      robbery: 17,
      vandalism: 2,
      drug: 29,
      vehicle: 3,
      other: 225,
    };

    CrimeLegendVanilla.render('#crime-legend', incidentCounts);
  </script>
</body>
</html>
```

---

## 📚 API Reference

### React Component Props

```typescript
interface CrimeLegendProps {
  incidentCounts?: Record<CrimeType, number>;  // Crime counts by type
  showTimeDecay?: boolean;                     // Show decay visualization (default: true)
}
```

### Available Utilities

#### React
```jsx
import { CrimeDecayUtils } from './components/CrimeLegend';

CrimeDecayUtils.calculateDaysSinceIncident(timestamp);
CrimeDecayUtils.getOpacityForAge(daysSinceIncident);
CrimeDecayUtils.getColorWithDecay(hexColor, daysSinceIncident);
CrimeDecayUtils.getCrimeColorWithDecay(crimeType, daysSinceIncident);
```

#### Vanilla JS
```javascript
CrimeLegendVanilla.render(selector, incidentCounts, options);
CrimeLegendVanilla.update(selector, incidentCounts);
CrimeLegendVanilla.utils.getOpacityForAge(daysSinceIncident);
```

---

## 🎨 Customization

### Change Colors

```javascript
// Edit CRIME_TYPE_CONFIG
const crimeTypeConfig = {
  theft: {
    label: "Theft",
    color: "text-green-600",     // Change this
    bgColor: "bg-green-500",     // And this
  },
};
```

### Change Decay Window

```javascript
// Change from 90 to 60 days
const TIME_DECAY_DAYS = 60;
```

### Hide Time Decay

```jsx
// React
<CrimeLegend showTimeDecay={false} />

// Vanilla JS
CrimeLegendVanilla.render('#container', data, { showTimeDecay: false });
```

---

## 💡 Examples

### Example 1: Auto-Updating Dashboard

```jsx
function Dashboard() {
  const [incidents, setIncidents] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/crime-stats')
        .then(r => r.json())
        .then(d => setIncidents(d.incidents));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return <CrimeLegend incidentCounts={incidents} />;
}
```

### Example 2: Time Period Filter

```jsx
function FilteredLegend() {
  const [days, setDays] = useState(90);
  const [incidents, setIncidents] = useState({});

  useEffect(() => {
    fetch(`/api/crime-stats?days=${days}`)
      .then(r => r.json())
      .then(d => setIncidents(d.incidents));
  }, [days]);

  return (
    <>
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={days === d ? 'btn-primary' : 'btn'}
          >
            {d}d
          </button>
        ))}
      </div>
      <CrimeLegend incidentCounts={incidents} />
    </>
  );
}
```

### Example 3: Using Colors in Custom Code

```javascript
import { CrimeDecayUtils } from './components/CrimeLegend';

function addMarkerToMap(incident) {
  const daysOld = CrimeDecayUtils.calculateDaysSinceIncident(incident.timestamp);
  const color = CrimeDecayUtils.getCrimeColorWithDecay(incident.type, daysOld);
  
  // Use color for map marker
  map.addMarker({
    position: { lat: incident.latitude, lng: incident.longitude },
    color: color,
    title: incident.description,
  });
}
```

---

## 🔧 Troubleshooting

### Component Not Rendering

- [ ] Verify data format matches (keys: theft, assault, burglary, etc.)
- [ ] Check that incident counts are numbers, not strings
- [ ] Ensure all required dependencies are imported

### Colors Not Showing

- [ ] React version: Ensure Tailwind CSS is installed and configured
- [ ] Vanilla JS: Check that color hex values are valid (#RRGGBB)

### Data Not Updating

- [ ] Verify API endpoint URL is correct
- [ ] Check that JSON response has correct structure
- [ ] Ensure setState is being called (React)

---

## 📊 Data Format

Your API should return incident data like this:

```json
{
  "incidents": {
    "theft": 245,
    "assault": 68,
    "burglary": 66,
    "robbery": 17,
    "vandalism": 2,
    "drug": 29,
    "vehicle": 3,
    "other": 225
  },
  "total": 655,
  "timeWindow": 90,
  "lastUpdated": "2024-03-17T10:30:00Z"
}
```

Pass the `incidents` object to the component:

```jsx
<CrimeLegend incidentCounts={data.incidents} />
```

---

## 🔗 Time Decay Explanation

### How It Works

1. **90-day window**: Backend fetches crimes from last 90 days
2. **Linear decay**: Opacity decreases linearly with age
3. **Formula**: `opacity = max(0.15, 1 - (daysOld / 90))`

### Example Values

| Days Old | Opacity | Display |
|----------|---------|---------|
| 0 days   | 1.00    | Solid color |
| 15 days  | 0.83    | Bright |
| 30 days  | 0.67    | Medium |
| 60 days  | 0.33    | Faded |
| 90 days  | 0.15    | Very faded |

---

## 🎯 Crime Types

The component supports 8 crime types:

1. **Theft** - 🟡 Yellow
2. **Assault** - 🔴 Red
3. **Burglary** - 🟠 Orange
4. **Robbery** - 🟥 Dark Red
5. **Vandalism** - 🟣 Purple
6. **Drug Activity** - 🟥 Pink
7. **Vehicle Crime** - 🔵 Blue
8. **Other** - ⚫ Gray

---

## 📦 Installation

### NPM (for sharing)

```bash
npm install kags-crime-legend
```

### Direct Copy-Paste

Just copy the component code above directly into your project.

---

## 📝 License & Attribution

**KAGS (Crime-Aware Routing)** Project  
Original Creator: Kyle  
Extracted: March 2026  

Free to use, modify, and distribute.

---

## ✅ Checklist

- [ ] Copy component file to your project
- [ ] Install dependencies (Tailwind CSS for React version)
- [ ] Update API endpoint to match your backend
- [ ] Test with sample data
- [ ] Customize colors if needed
- [ ] Deploy to production

---

## 🚀 Ready to Use!

Everything you need is above. Copy the appropriate section and implement in your project. Questions? Check the examples or refer to the API reference.

Happy coding! 🎉
