import React from 'react';
import { getRiskLevel } from '@services/riskScoring';
import styles from './RiskDisplay.module.css';

/**
 * RiskDisplay Component
 * Shows route risk score with color-coded level and recommendations
 */
export default function RiskDisplay({ 
  riskScore, 
  routeDistance,
  routeDuration,
  recommendations = [],
  showDetails = true 
}) {
  if (riskScore === null && riskScore === undefined) {
    return null;
  }

  const riskLevel = getRiskLevel(riskScore);
  const scorePercentage = Math.round(riskScore * 100);

  return (
    <div className={styles.riskDisplay} style={{ borderLeft: `4px solid ${riskLevel.color}` }}>
      <div className={styles.scoreContainer}>
        <div className={styles.scoreIndicator} style={{ backgroundColor: riskLevel.color }}>
          <span className={styles.scoreValue}>{scorePercentage}</span>
          <span className={styles.scoreLabel}>Risk</span>
        </div>
        
        <div className={styles.scoreDetails}>
          <div className={styles.riskLevel} style={{ color: riskLevel.color }}>
            {riskLevel.icon} {riskLevel.label}
          </div>
          
          {routeDistance && routeDuration && (
            <div className={styles.routeInfo}>
              <span className={styles.distance}>{routeDistance} mi</span>
              <span className={styles.duration}>{routeDuration} min</span>
            </div>
          )}
        </div>
      </div>

      {showDetails && recommendations.length > 0 && (
        <div className={styles.recommendations}>
          <h4 className={styles.recommendationsTitle}>Safety Recommendations</h4>
          <ul className={styles.recommendationsList}>
            {recommendations.map((rec, idx) => (
              <li key={idx} className={styles.recommendationItem}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDetails && (
        <div className={styles.riskExplanation}>
          <p className={styles.explanation}>
            {riskScore < 0.2 && 'This route passes through safe areas. Standard precautions recommended.'}
            {riskScore >= 0.2 && riskScore < 0.4 && 'This route is generally safe. Stay aware of your surroundings.'}
            {riskScore >= 0.4 && riskScore < 0.6 && 'Exercise caution on this route. Travel during daylight if possible.'}
            {riskScore >= 0.6 && riskScore < 0.8 && 'High-risk areas detected. Consider alternative routes if available.'}
            {riskScore >= 0.8 && 'Very high risk. Strongly consider using alternative transportation methods.'}
          </p>
        </div>
      )}
    </div>
  );
}
