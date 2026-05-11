import React, { useMemo } from 'react';
import { getRiskLevel, generateRecommendations, getTimeOfDay } from '../../services/riskScoring';
import styles from './RiskAssessment.module.css';

export default function RiskAssessment({ 
  riskScore = 0.5, 
  distance = null, 
  duration = null,
  showDetailed = false,
  timeOfDay = null 
}) {
  const riskLevel = getRiskLevel(riskScore);
  const tod = timeOfDay || getTimeOfDay(new Date().getHours());
  const recommendations = useMemo(
    () => generateRecommendations(riskScore, tod),
    [riskScore, tod]
  );

  const riskPercentage = Math.round(riskScore * 100);
  const safetyPercentage = 100 - riskPercentage;

  return (
    <div className={styles.riskAssessment}>
      {/* Risk Score Header */}
      <div className={styles.riskHeader} style={{ borderLeftColor: riskLevel.color }}>
        <div className={styles.riskScore}>
          <div 
            className={styles.scoreCircle}
            style={{ 
              background: `conic-gradient(${riskLevel.color} 0deg ${safetyPercentage * 3.6}deg, #e0e0e0 ${safetyPercentage * 3.6}deg)`
            }}
          >
            <div className={styles.scoreInner}>
              <span className={styles.scoreValue}>{riskPercentage}%</span>
              <span className={styles.scoreLabel}>Risk</span>
            </div>
          </div>
        </div>

        <div className={styles.riskInfo}>
          <h3 className={styles.riskLevel} style={{ color: riskLevel.color }}>
            {riskLevel.icon} {riskLevel.label}
          </h3>
          <p className={styles.riskDescription}>
            Safety score: <strong>{safetyPercentage}%</strong>
          </p>
          {distance && (
            <p className={styles.routeStats}>
              <span className={styles.stat}>📍 {distance} mi</span>
              {duration && <span className={styles.stat}>⏱️ {duration} min</span>}
            </p>
          )}
        </div>
      </div>

      {/* Recommendations */}
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

      {/* Detailed View Toggle */}
      {showDetailed && (
        <div className={styles.details}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Time of Day</span>
              <span className={styles.detailValue}>{tod.charAt(0).toUpperCase() + tod.slice(1)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Day of Week</span>
              <span className={styles.detailValue}>
                {new Date().toLocaleString('en-us', { weekday: 'short' })}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Route Risk Level</span>
              <span 
                className={styles.detailValue}
                style={{ color: riskLevel.color }}
              >
                {riskLevel.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
