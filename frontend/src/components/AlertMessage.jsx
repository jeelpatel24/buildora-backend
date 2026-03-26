/*
 * AlertMessage.jsx
 * -----------------------------------------------
 * Reusable alert/notification component.
 * Demonstrates: props, conditional rendering, prop-driven styling.
 */

import './AlertMessage.css';

// type: 'success' | 'error' | 'warning' | 'info'
export default function AlertMessage({ type = 'info', message, onClose }) {
  if (!message) return null;

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  return (
    <div className={`alert alert--${type}`} role="alert">
      <span className="alert-icon">{icons[type]}</span>
      <span className="alert-text">{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
