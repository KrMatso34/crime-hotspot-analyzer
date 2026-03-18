# Installation & Integration Guide

## 📁 File Structure

```
crime-hotspot-analyzer/
├── src/
│   ├── CrimeLegend.jsx          ← Copy this to your components folder
│   └── CrimeLegend.js            ← Or use this for vanilla JS
├── README.md                     ← GitHub documentation
├── COMPLETE_KAGS_PACKAGE.md     ← Full reference with code examples
├── SPRINT_5_REPORT.md           ← Sprint 5 accomplishments
└── package.json                 ← NPM metadata
```

## 🚀 Integration Steps

### Step 1: Add Files to Your Project

**If using React:**
```bash
# Copy the React component
cp src/CrimeLegend.jsx your-project/src/components/

# Update your component imports
import { CrimeLegend } from './components/CrimeLegend';
```

**If using Vanilla JS:**
```bash
# Copy the vanilla version
cp src/CrimeLegend.js your-project/public/

# Add to your HTML
<script src="/CrimeLegend.js"></script>
```

### Step 2: Use in Your Project

#### React Example
```jsx
import { CrimeLegend } from './components/CrimeLegend';
import { useState, useEffect } from 'react';

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

#### Vanilla JS Example
```html
<div id="crime-legend"></div>

<script src="CrimeLegend.js"></script>
<script>
  fetch('/api/crime-stats')
    .then(res => res.json())
    .then(data => {
      CrimeLegendVanilla.render('#crime-legend', data.incidents);
    });
</script>
```

### Step 3: Update API Endpoint

Make sure your API returns data in this format:
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
  }
}
```

### Step 4: Test

1. Run your project
2. Verify the crime legend displays
3. Check that time decay visualization shows correctly
4. Confirm colors match crime types

## 🎨 Customization

### Change Colors
Edit the `crimeTypeConfig` object in the component file:
```javascript
const crimeTypeConfig = {
  theft: { label: "Theft", color: "#eab308" }, // Change hex color
  // ... rest of types
};
```

### Change Decay Window
Modify `TIME_DECAY_DAYS` constant (default: 90):
```javascript
const TIME_DECAY_DAYS = 60; // Change to 60 days instead of 90
```

### Hide Time Decay Section
```jsx
// React
<CrimeLegend showTimeDecay={false} />

// Vanilla JS
CrimeLegendVanilla.render('#legend', data, { showTimeDecay: false });
```

## 📚 Reference Files

- **`COMPLETE_KAGS_PACKAGE.md`** - Complete documentation with all code, API reference, examples, and troubleshooting
- **`SPRINT_5_REPORT.md`** - Sprint 5 context and accomplishments
- **`README.md`** - GitHub repository documentation

## ✅ Checklist

- [ ] Create feature branch: `git checkout -b feature/crime-legend-component`
- [ ] Copy component files to your project
- [ ] Import component in your dashboard/layout
- [ ] Update API endpoint to match your backend
- [ ] Test with real crime data
- [ ] Customize colors/styling if needed
- [ ] Run tests
- [ ] Create pull request
- [ ] Merge to main

## 🔗 Data Integration

The component expects incident data to flow from:
1. **Seattle API** → AWS Lambda
2. **Bellevue API** → AWS Lambda
3. **Processing** → DynamoDB (90-day filtered)
4. **Endpoint** → `/api/crime-stats`
5. **Component** → Displays legend with time decay

This matches the Sprint 5 pipeline setup.

## 🐛 Troubleshooting

### Component not rendering?
- Check that `incidentCounts` has the correct keys (theft, assault, burglary, etc.)
- Verify values are numbers, not strings
- Ensure container element exists in DOM

### Colors not showing correctly?
- Verify hex color values are valid (#RRGGBB format)
- Check browser console for errors
- Test with sample data first

### Data not updating?
- Verify API endpoint returns correct JSON structure
- Check network tab in browser dev tools
- Confirm setState is being called (React)
- Test API endpoint directly

## 📞 Questions?

Refer to `COMPLETE_KAGS_PACKAGE.md` for:
- Full API reference
- Working examples
- All utility functions
- Complete troubleshooting guide

## 🚀 Ready to Go

Everything is production-ready and zero dependencies. Copy, use, and deploy!
