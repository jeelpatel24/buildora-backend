/*
 * LoadingSpinner.jsx
 * -----------------------------------------------
 * Animated loading indicator component.
 * Demonstrates: pure presentational component, CSS animation.
 */

import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="spinner-wrapper">
      <div className="spinner-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
}
