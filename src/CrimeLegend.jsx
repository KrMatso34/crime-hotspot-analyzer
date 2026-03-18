/**
 * KAGS - Crime Legend with Time Decay (90 Days)
 * Extracted from Safe-Route project - JAVASCRIPT VERSION
 * 
 * This legend shows:
 * - Crime severity color coding
 * - Time decay visualization (90-day window)
 * - Incident type breakdown
 * 
 * Ready to implement on any project
 */

// ============================================================================
// CRIME TYPE CONFIGURATION
// ============================================================================
const crimeTypeConfig = {
  theft: { 
    label: "Theft", 
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500",
    icon: "Package"
  },
  assault: { 
    label: "Assault", 
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-600",
    icon: "UserX"
  },
  burglary: { 
    label: "Burglary", 
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500",
    icon: "Home"
  },
  robbery: { 
    label: "Robbery", 
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-700",
    icon: "Banknote"
  },
  vandalism: { 
    label: "Vandalism", 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500",
    icon: "Paintbrush"
  },
  drug: { 
    label: "Drug Activity", 
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500",
    icon: "Pill"
  },
  vehicle: { 
    label: "Vehicle Crime", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500",
    icon: "Car"
  },
  other: { 
    label: "Other", 
    color: "text-muted-foreground",
    bgColor: "bg-gray-500",
    icon: "HelpCircle"
  },
};

// ============================================================================
// TIME DECAY CONSTANTS
// ============================================================================
const TIME_DECAY_DAYS = 90; // Your project's decay window

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
 * @param {string} timestamp - ISO timestamp of incident
 * @returns {number} Days since incident
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
 * @param {number} daysSinceIncident - Days since incident
 * @returns {number} Opacity value 0.15 to 1
 */
function getOpacityForAge(daysSinceIncident) {
  const normalizedAge = Math.min(daysSinceIncident / TIME_DECAY_DAYS, 1);
  const opacity = Math.max(0.15, 1 - normalizedAge);
  return opacity;
}

/**
 * Convert hex color to RGB and apply opacity
 * @param {string} hexColor - Hex color code (#RRGGBB)
 * @param {number} daysSinceIncident - Days since incident
 * @returns {string} RGBA color string
 */
function getColorWithDecay(hexColor, daysSinceIncident) {
  const opacity = getOpacityForAge(daysSinceIncident);
  
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Convert Tailwind color to hex for decay calculation
 * @param {string} bgColor - Tailwind bg color class
 * @returns {string} Hex color code
 */
function tailwindToHex(bgColor) {
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
  return colorMap[bgColor] || "#6b7280";
}

/**
 * Get RGBA color with decay applied
 * @param {string} crimeType - Crime type key
 * @param {number} daysSinceIncident - Days since incident
 * @returns {string} RGBA color string
 */
function getCrimeColorWithDecay(crimeType, daysSinceIncident) {
  const config = crimeTypeConfig[crimeType];
  if (!config) return "rgba(107, 114, 128, 0.5)";
  
  const hexColor = tailwindToHex(config.bgColor);
  return getColorWithDecay(hexColor, daysSinceIncident);
}

// ============================================================================
// CRIME LEGEND COMPONENT (React/JSX)
// ============================================================================

/**
 * CrimeLegend Component
 * Displays crime types with colors and time decay visualization
 * 
 * @component
 * @example
 * <CrimeLegend 
 *   incidentCounts={{ theft: 245, assault: 68, ... }}
 *   showTimeDecay={true}
 * />
 */
function CrimeLegend({ incidentCounts = {}, showTimeDecay = true }) {
  const allCrimeTypes = ["theft", "assault", "burglary", "robbery", "vandalism", "drug", "vehicle", "other"];

  return (
    <div className="space-y-3">
      {/* ===== CRIME SEVERITY SECTION ===== */}
      <div className="bg-muted/30 rounded-lg border">
        {/* Header */}
        <div className="border-b p-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            Crime Severity Legend
          </h3>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Crime Types Grid */}
          <div className="grid grid-cols-1 gap-2">
            {allCrimeTypes.map((type) => {
              const config = crimeTypeConfig[type];
              const count = incidentCounts[type] || 0;

              return (
                <div key={type} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  {/* Color Swatch */}
                  <div className={`w-4 h-4 rounded flex-shrink-0 ${config.bgColor}`} />
                  
                  {/* Label and Count */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {count > 0 && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== TIME DECAY VISUALIZATION SECTION ===== */}
      {showTimeDecay && (
        <div className="bg-muted/30 rounded-lg border">
          {/* Header */}
          <div className="border-b p-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">📅</span>
              Time Decay (90 Days)
            </h3>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Crime incidents fade over time. Older incidents appear more transparent.
            </p>

            {/* Time Decay Examples */}
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

                  {/* Decay Bars */}
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
                            style={{
                              backgroundColor: decayColor,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend Explanation */}
            <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
              <p>• <strong>Bright colors</strong> = Recent incidents (high concern)</p>
              <p>• <strong>Faded colors</strong> = Older incidents (low concern)</p>
              <p>• <strong>Invisible</strong> = Beyond 90-day window</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

const CrimeDecayUtils = {
  TIME_DECAY_DAYS,
  TIME_DECAY_EXAMPLES,
  calculateDaysSinceIncident,
  getOpacityForAge,
  getColorWithDecay,
  tailwindToHex,
  getCrimeColorWithDecay,
  crimeTypeConfig,
};

// Export for use in other files
export {
  CrimeLegend,
  CrimeDecayUtils,
  calculateDaysSinceIncident,
  getOpacityForAge,
  getColorWithDecay,
  getCrimeColorWithDecay,
  crimeTypeConfig,
};

// For CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CrimeLegend,
    CrimeDecayUtils,
    calculateDaysSinceIncident,
    getOpacityForAge,
    getColorWithDecay,
    getCrimeColorWithDecay,
    crimeTypeConfig,
  };
}
