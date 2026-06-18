/**
 * Crime Legend Component with Time Decay (90 Days)
 * Zero dependencies - pure React with inline styles
 * 
 * This legend shows:
 * - Crime severity color coding
 * - Time decay visualization (90-day window)
 * - Incident type breakdown
 */

import styles from './CrimeLegend.module.css';
import clsx from 'clsx';

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

function ColorSquare({color='white'}) {
	return <div className={clsx(styles.colorSquare)} style={{backgroundColor: color, width: '1em', height: '1em'}}></div>
}

const heatmapColors = [
	{
		label: '1.0 - Severe',
		color: 'red'
	},
	{
		label: '0.7 - Warning',
		color: 'orange'
	},
	{
		label: '0.4 - Mild',
		color: 'lime'
	},
	{
		label: '0.1 - Safe',
		color: 'blue'
	},
]

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
    <div className={styles.crimeLegend}>
		<h3>Legend</h3>
		<div>
			<div>
				{heatmapColors.map(colorData => (
					<div key={colorData.label} className={clsx(styles.legendLine)}>
						<ColorSquare color={colorData.color}/>
						<label>: {colorData.label}</label>
					</div>
				))}
			</div>
		</div>
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