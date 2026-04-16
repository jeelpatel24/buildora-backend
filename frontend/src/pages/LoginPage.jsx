/*
 * LoginPage.jsx
 * -----------------------------------------------
 * Login form page.
 *
 * Sprint 3 changes:
 *   - login() is now async (it calls the real API).
 *   - API error messages come from error.response.data.error
 *     and fall back to the generic error string.
 *   - Demo credential pills are kept so the instructor can
 *     quickly switch between roles without remembering passwords.
 */

import { useState } from 'react';
import { useAuth }  from '../context/AuthContext';
import { useNav }   from '../context/AppContext';
import AlertMessage from '../components/AlertMessage';
import './AuthPage.css';

const DEMO_ACCOUNTS = [
  { role: 'Homeowner',  email: 'homeowner@demo.com', password: 'demo123' },
  { role: 'Contractor', email: 'contractor@demo.com', password: 'demo123' },
  { role: 'Admin',      email: 'admin@buildora.com',  password: 'admin123' },
];

export default function LoginPage() {
  const { login }    = useAuth();
  const { navigate } = useNav();

  const [formData,  setFormData]  = useState({ email: '', password: '' });
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('dashboard');
    } catch (err) {
      // API returns { error: '...' } on failure
      setApiError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function fillDemo(account) {
    setFormData({ email: account.email, password: account.password });
    setErrors({});
    setApiError('');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your Buildora account</p>
        </div>

        {/* Demo accounts */}
        <div className="demo-accounts">
          <p className="demo-label">Quick demo login:</p>
          <div className="demo-pills">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.role}
                className="demo-pill"
                type="button"
                onClick={() => fillDemo(acc)}
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>

        {apiError && (
          <AlertMessage type="error" message={apiError} onClose={() => setApiError('')} />
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isLoading}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className={`form-group ${errors.password ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={isLoading}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <button className="auth-link" onClick={() => navigate('register')}>
            Create one free
          </button>
        </p>
      </div>
    </div>
  );
}
