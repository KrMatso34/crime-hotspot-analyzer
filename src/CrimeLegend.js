/**
 * KAGS Crime Legend - Plain JavaScript Version (Vanilla JS + HTML)
 * No React dependency - works with any framework or vanilla JS
 * 
 * USAGE:
 * 1. Include this file in your project
 * 2. Create a container element: <div id="crime-legend"></div>
 * 3. Call: CrimeLegend.render('#crime-legend', incidentCounts)
 */

const CrimeLegendVanilla = (() => {
  // ========================================================================
  // CONSTANTS
  // ========================================================================
  
  const TIME_DECAY_DAYS = 90;
  
  const CRIME_TYPE_CONFIG = {
    theft: { 
      label: "Theft", 
      color: "#eab308",
      borderColor: "#eab308",
      displayColor: "text-yellow-600"
    },
    assault: { 
      label: "Assault", 
      color: "#dc2626",
      borderColor: "#dc2626",
      displayColor: "text-red-600"
    },
    burglary: { 
      label: "Burglary", 
      color: "#f97316",
      borderColor: "#f97316",
      displayColor: "text-orange-600"
    },
    robbery: { 
      label: "Robbery", 
      color: "#b91c1c",
      borderColor: "#b91c1c",
      displayColor: "text-red-700"
    },
    vandalism: { 
      label: "Vandalism", 
      color: "#a855f7",
      borderColor: "#a855f7",
      displayColor: "text-purple-600"
    },
    drug: { 
      label: "Drug Activity", 
      color: "#ec4899",
      borderColor: "#ec4899",
      displayColor: "text-pink-600"
    },
    vehicle: { 
      label: "Vehicle Crime", 
      color: "#3b82f6",
      borderColor: "#3b82f6",
      displayColor: "text-blue-600"
    },
    other: { 
      label: "Other", 
      color: "#6b7280",
      borderColor: "#6b7280",
      displayColor: "text-gray-600"
    },
  };

  const TIME_DECAY_EXAMPLES = [
    { label: "Recent (0-7 days)", days: 3.5, intensity: "Very High" },
    { label: "1-2 weeks", days: 10, intensity: "High" },
    { label: "1 month", days: 30, intensity: "Medium" },
    { label: "2-3 months (90 day max)", days: 75, intensity: "Fading" },
  ];

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  function calculateDaysSinceIncident(timestamp) {
    const incidentDate = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - incidentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

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

  // ========================================================================
  // HTML GENERATION
  // ========================================================================

  function createCrimeSeveritySection(incidentCounts = {}) {
    const allTypes = Object.keys(CRIME_TYPE_CONFIG);
    
    let html = `
      <div style="background-color: rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">⚠️</span>
            Crime Severity Legend
          </h3>
        </div>
        
        <div style="padding: 12px; display: grid; gap: 8px;">
    `;

    allTypes.forEach(type => {
      const config = CRIME_TYPE_CONFIG[type];
      const count = incidentCounts[type] || 0;

      html += `
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; transition: background-color 0.2s; cursor: pointer;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.05)'" onmouseout="this.style.backgroundColor='transparent'">
          <!-- Color Swatch -->
          <div style="width: 16px; height: 16px; border-radius: 4px; background-color: ${config.color}; flex-shrink: 0;"></div>
          
          <!-- Label -->
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; font-weight: 500; color: #1f2937;">
                ${config.label}
              </span>
              ${count > 0 ? `
                <span style="display: inline-flex; align-items: center; background-color: #f3f4f6; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; color: #374151;">
                  ${count}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  function createTimeDecaySection() {
    let html = `
      <div style="background-color: rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📅</span>
            Time Decay (90 Days)
          </h3>
        </div>
        
        <div style="padding: 12px; display: grid; gap: 16px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            Crime incidents fade over time. Older incidents appear more transparent.
          </p>
    `;

    TIME_DECAY_EXAMPLES.forEach((example, idx) => {
      html += `
        <div style="display: grid; gap: 6px;">
          <!-- Label -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 500; color: #6b7280;">
              ${example.label}
            </span>
            <span style="font-size: 12px; color: #6b7280;">
              ${example.intensity}
            </span>
          </div>

          <!-- Decay Bars -->
          <div style="display: grid; gap: 4px;">
      `;

      ["theft", "assault", "burglary", "robbery"].forEach(type => {
        const config = CRIME_TYPE_CONFIG[type];
        const decayColor = getCrimeColorWithDecay(type, example.days);

        html += `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #6b7280; width: 40px; text-align: right;">
              ${config.label.slice(0, 3)}
            </span>
            <div 
              style="flex: 1; height: 24px; border-radius: 4px; border: 1px solid rgba(0, 0, 0, 0.1); background-color: ${decayColor};"
            ></div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
          <!-- Legend Explanation -->
          <div style="padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; display: grid; gap: 4px;">
            <p style="margin: 0;">• <strong>Bright colors</strong> = Recent incidents (high concern)</p>
            <p style="margin: 0;">• <strong>Faded colors</strong> = Older incidents (low concern)</p>
            <p style="margin: 0;">• <strong>Invisible</strong> = Beyond 90-day window</p>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  return {
    // Render the legend to a DOM element
    render: function(selector, incidentCounts = {}, options = {}) {
      const { showTimeDecay = true } = options;
      const container = document.querySelector(selector);
      
      if (!container) {
        console.error(`Element not found: ${selector}`);
        return;
      }

      let html = `<div style="display: grid; gap: 12px;">`;
      
      html += createCrimeSeveritySection(incidentCounts);
      
      if (showTimeDecay) {
        html += createTimeDecaySection();
      }
      
      html += `</div>`;

      container.innerHTML = html;
    },

    // Update the legend data
    update: function(selector, incidentCounts = {}) {
      this.render(selector, incidentCounts);
    },

    // Get the legend as HTML string (for insertion elsewhere)
    getHTML: function(incidentCounts = {}, options = {}) {
      const { showTimeDecay = true } = options;
      let html = `<div style="display: grid; gap: 12px;">`;
      
      html += createCrimeSeveritySection(incidentCounts);
      
      if (showTimeDecay) {
        html += createTimeDecaySection();
      }
      
      html += `</div>`;
      
      return html;
    },

    // Utility functions (public)
    utils: {
      calculateDaysSinceIncident,
      getOpacityForAge,
      getColorWithDecay,
      getCrimeColorWithDecay,
      TIME_DECAY_DAYS,
      CRIME_TYPE_CONFIG,
    },

    // Get color for a specific crime
    getColorForCrime: function(crimeType, daysOld) {
      return getCrimeColorWithDecay(crimeType, daysOld);
    },

    // Get opacity for a specific age
    getOpacity: function(daysOld) {
      return getOpacityForAge(daysOld);
    },
  };
})();

// ============================================================================
// EXPORT FOR MODULE SYSTEMS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrimeLegendVanilla;
}

if (typeof define === 'function' && define.amd) {
  define([], () => CrimeLegendVanilla);
}
