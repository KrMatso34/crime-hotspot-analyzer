# KAGS Crime Legend Component

<img width="812" height="608" alt="image" src="https://github.com/user-attachments/assets/94910363-8c8d-43da-baaf-74e770bcb32f" />


[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

> 🎯 Production-ready crime legend component with 90-day time decay visualization  
> Extracted from the KAGS (Crime-Aware Routing) project  
> Works with React, Vue, Angular, or vanilla JavaScript

## Features

✨ **90-Day Time Decay** - Visual fading based on incident age  
✨ **8 Crime Types** - Theft, Assault, Burglary, Robbery, Vandalism, Drug, Vehicle, Other  
✨ **Color-Coded** - Severity indicated through color intensity  
✨ **Framework Agnostic** - React, Vue, Angular, or plain JS  
✨ **Zero Dependencies** (Vanilla JS) - Or minimal (React + Tailwind)  
✨ **Production Ready** - Tested and documented  
✨ **Fully Customizable** - Easy to modify colors, decay window, etc.  

## Quick Start

### React

```bash
# Copy the component file
cp src/components/CrimeLegend.jsx your-project/src/components/
```

```jsx
import { CrimeLegend } from './components/CrimeLegend';

function App() {
  const incidents = {
    theft: 245,
    assault: 68,
    burglary: 66,
    robbery: 17,
    vandalism: 2,
    drug: 29,
    vehicle: 3,
    other: 225,
  };

  return <CrimeLegend incidentCounts={incidents} showTimeDecay={true} />;
}
```

### Vanilla JavaScript

```html
<script src="CrimeLegend.js"></script>
<div id="legend"></div>

<script>
  CrimeLegendVanilla.render('#legend', {
    theft: 245,
    assault: 68,
    // ... etc
  });
</script>
```

## Installation

### Option 1: Direct Copy (Easiest)

Copy the appropriate file to your project:
- **React**: `src/components/CrimeLegend.jsx`
- **Vanilla JS**: `CrimeLegend.js`
- **HTML**: `index.html`

### Option 2: NPM Install

```bash
npm install kags-crime-legend
```

### Option 3: Clone Repository

```bash
git clone https://github.com/yourusername/kags-crime-legend.git
cd kags-crime-legend
npm install
```

## Usage

### React Component

```jsx
import { CrimeLegend, CrimeDecayUtils } from './components/CrimeLegend';

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

// Access utilities
const opacity = CrimeDecayUtils.getOpacityForAge(30); // 30 days
const color = CrimeDecayUtils.getCrimeColorWithDecay('assault', 45);
```

### Vanilla JavaScript

```javascript
// Render the legend
CrimeLegendVanilla.render('#crime-legend', {
  theft: 245,
  assault: 68,
  burglary: 66,
  robbery: 17,
  vandalism: 2,
  drug: 29,
  vehicle: 3,
  other: 225,
});

// Update with new data
CrimeLegendVanilla.update('#crime-legend', newIncidents);

// Use utilities
const opacity = CrimeLegendVanilla.utils.getOpacityForAge(30);
const color = CrimeLegendVanilla.utils.getCrimeColorWithDecay('theft', 15);
```

## API Reference

### React Props

```typescript
interface CrimeLegendProps {
  incidentCounts?: Record<CrimeType, number>;  // Crime counts by type
  showTimeDecay?: boolean;                     // Show decay visualization (default: true)
}
```

### Crime Types

```typescript
type CrimeType = 
  | 'theft'
  | 'assault'
  | 'burglary'
  | 'robbery'
  | 'vandalism'
  | 'drug'
  | 'vehicle'
  | 'other';
```

### Available Utilities

#### React
```javascript
import { CrimeDecayUtils } from './components/CrimeLegend';

// Calculate days since incident
CrimeDecayUtils.calculateDaysSinceIncident(timestamp);

// Get opacity (0.15 to 1.0) based on age
CrimeDecayUtils.getOpacityForAge(daysSince);

// Get RGBA color with decay applied
CrimeDecayUtils.getColorWithDecay(hexColor, daysSince);

// Get color for specific crime type with decay
CrimeDecayUtils.getCrimeColorWithDecay(crimeType, daysSince);
```

#### Vanilla JS
```javascript
// All utilities available via CrimeLegendVanilla.utils
CrimeLegendVanilla.utils.getOpacityForAge(30);
CrimeLegendVanilla.utils.getCrimeColorWithDecay('assault', 45);
```

## Customization

### Change Colors

Edit the `crimeTypeConfig` object:

```javascript
const crimeTypeConfig = {
  theft: {
    label: "Theft",
    color: "text-green-600",      // Change to your color
    bgColor: "bg-green-500",       // Change background
  },
  // ... rest of types
};
```

### Change Decay Window

Default is 90 days. To change:

```javascript
const TIME_DECAY_DAYS = 60;  // Changed from 90
```

### Hide Time Decay Section

```jsx
// React
<CrimeLegend showTimeDecay={false} />

// Vanilla JS
CrimeLegendVanilla.render('#container', data, { showTimeDecay: false });
```

## Time Decay Explanation

The component uses **linear decay** over 90 days:

- **0 days old**: 100% opacity (solid color)
- **45 days old**: 50% opacity (medium fade)
- **90 days old**: 15% opacity (very faded)
- **90+ days**: Not shown (filtered by backend)

**Formula**: `opacity = max(0.15, 1 - (daysOld / 90))`

This gives users a visual sense of incident recency - recent crimes stand out, older ones fade.

## Data Format

The component expects incident counts in this format:

```javascript
{
  theft: 245,
  assault: 68,
  burglary: 66,
  robbery: 17,
  vandalism: 2,
  drug: 29,
  vehicle: 3,
  other: 225,
}
```

If your API returns a larger object, extract just the counts:

```javascript
fetch('/api/stats')
  .then(res => res.json())
  .then(data => {
    // Pass just the incidents object
    CrimeLegend.render('#container', data.incidents);
  });
```

## Examples

### Example 1: Auto-Updating Dashboard

```jsx
function Dashboard() {
  const [incidents, setIncidents] = useState({});

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      fetch('/api/crime-stats')
        .then(r => r.json())
        .then(d => setIncidents(d.incidents));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return <CrimeLegend incidentCounts={incidents} />;
}
```

### Example 2: Filterable by Time Period

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

### Example 3: Use Colors in Custom Code

```javascript
import { CrimeDecayUtils } from './components/CrimeLegend';

function addIncidentToMap(incident) {
  const daysOld = CrimeDecayUtils.calculateDaysSinceIncident(incident.timestamp);
  const color = CrimeDecayUtils.getCrimeColorWithDecay(incident.type, daysOld);
  
  // Add marker to map with color
  map.addMarker({
    position: { lat: incident.latitude, lng: incident.longitude },
    color: color,
    title: incident.description,
  });
}
```

## Requirements

### React Version
- React 16.8+ (for hooks)
- Tailwind CSS 3.0+ (for styling)
- Optional: UI components from shadcn/ui

### Vanilla JavaScript Version
- No dependencies required!
- Works in all modern browsers

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅ |
| Firefox | ✅ |
| Safari  | ✅ |
| Edge    | ✅ |
| IE 11   | ❌ |

## Troubleshooting

### Component not rendering
- Verify incident counts object has correct keys (theft, assault, etc.)
- Ensure values are numbers, not strings
- Check that container element exists

### Colors not showing (React)
- Ensure Tailwind CSS is installed
- Check that colors are defined in tailwind.config.js
- Verify no CSS conflicts

### Data not updating
- Check API endpoint URL is correct
- Verify JSON response structure matches expected format
- For React: Confirm setState is being called

## Performance

The component is optimized for performance:

- Minimal re-renders in React (uses memo by default)
- Fast calculations using simple math
- Efficient DOM rendering in Vanilla JS

For large datasets (1000+ incidents), consider:
- Memoizing calculations
- Using virtual scrolling if needed
- Batching API updates

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Original project: **KAGS (Crime-Aware Routing)**
- Creator: Kyle
- Extracted: March 2026

## Support

For issues, questions, or suggestions:

- 📝 Open an issue on GitHub
- 📧 Email: support@example.com
- 💬 Discussions: GitHub Discussions tab

## Changelog

### v1.0.0 (Initial Release)
- Initial component release
- React and Vanilla JS versions
- Full documentation
- 90-day time decay
- 8 crime types
- Time decay visualization

## Roadmap

- [ ] Vue component
- [ ] Angular component
- [ ] Svelte component
- [ ] Mobile optimization
- [ ] Dark mode improvements
- [ ] Animation options

---

**Made with ❤️ for better crime awareness and community safety**
