/*
 * NotFoundPage.jsx
 * Custom 404 page shown when a user visits a URL that doesn't match any route.
 * Gives the user a helpful message and a button to get back on track.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Send logged-in users to their dashboard, guests to the home page
  function handleGoBack() {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }

  return (
    <div className="notfound-page">
      <div className="notfound-card">

        {/* Big 404 number */}
        <div className="notfound-code">404</div>

        {/* Friendly icon */}
        <div className="notfound-icon">🔍</div>

        <h1 className="notfound-title">Page Not Found</h1>

        <p className="notfound-message">
          Looks like this page doesn't exist or was moved.
          Double-check the URL, or head back to safety.
        </p>

        <button className="notfound-btn" onClick={handleGoBack}>
          {currentUser ? 'Go to Dashboard' : 'Go to Home'}
        </button>
      </div>
    </div>
  );
}
