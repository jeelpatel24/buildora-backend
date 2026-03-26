/*
 * StatCard.jsx
 * -----------------------------------------------
 * A KPI / statistic display card.
 * Demonstrates: pure presentational component, prop types, children.
 */

import './StatCard.css';

export default function StatCard({ icon, label, value, trend, accent = 'orange' }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="sc-icon-wrap">{icon}</div>
      <div className="sc-body">
        <div className="sc-value">{value}</div>
        <div className="sc-label">{label}</div>
        {trend !== undefined && (
          <div className={`sc-trend ${trend >= 0 ? 'sc-trend--up' : 'sc-trend--down'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% this month
          </div>
        )}
      </div>
    </div>
  );
}
