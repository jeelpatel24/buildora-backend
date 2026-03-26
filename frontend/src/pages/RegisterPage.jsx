/*
 * RegisterPage.jsx
 * -----------------------------------------------
 * Multi-field registration form with role selection.
 * Demonstrates: controlled form with multiple fields,
 * complex validation, useState, conditional rendering,
 * interactive role picker component.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNav }  from '../context/AppContext';
import AlertMessage from '../components/AlertMessage';
import './AuthPage.css';

const ROLES = [
  {
    value: 'Homeowner',
    icon:  '🏠',
    name:  'Homeowner',
    desc:  'Post renovation projects and hire contractors',
  },
  {
    value: 'Contractor',
    icon:  '🔨',
    name:  'Contractor',
    desc:  'Browse projects and submit competitive proposals',
  },
];

// Password strength meter helper
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)             score++;
  if (/[A-Z]/.test(password))           score++;
  if (/[0-9]/.test(password))           score++;
  if (/[^A-Za-z0-9]/.test(password))    score++;

  const levels = [
    { label: '',        color: '' },
    { label: 'Weak',    color: '#ef4444' },
    { label: 'Fair',    color: '#eab308' },
    { label: 'Good',    color: '#3b82f6' },
    { label: 'Strong',  color: '#22c55e' },
  ];
  return levels[score];
}

export default function RegisterPage() {
  const { register }  = useAuth();
  const { navigate }  = useNav();

  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    role:            'Homeowner',
  });
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pwStrength = getPasswordStrength(formData.password);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleRoleSelect(role) {
    setFormData((prev) => ({ ...prev, role }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
  }

  function validate() {
    const e = {};
    if (!formData.name.trim()) {
      e.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters.';
    }
    if (!formData.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      e.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
    }
    if (!formData.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      register(formData.name.trim(), formData.email.trim(), formData.password, formData.role);
      navigate('dashboard');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join Buildora — Canada's renovation marketplace</p>
        </div>

        {apiError && (
          <AlertMessage type="error" message={apiError} onClose={() => setApiError('')} />
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Role selector — interactive component driven by state */}
          <div className="form-group">
            <label className="form-label">I am a…</label>
            <div className="role-selector">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`role-option ${formData.role === r.value ? 'role-option--active' : ''}`}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-name">{r.name}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full name */}
          <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Jane Smith"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Password + strength indicator */}
          <div className={`form-group ${errors.password ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {/* Password strength bar */}
            {formData.password && (
              <div className="pw-strength">
                <div className="pw-strength-bar">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="pw-strength-segment"
                      style={{
                        background:
                          i <= ['', 'Weak', 'Fair', 'Good', 'Strong'].indexOf(pwStrength.label)
                            ? pwStrength.color
                            : 'var(--clr-border)',
                      }}
                    />
                  ))}
                </div>
                {pwStrength.label && (
                  <span className="pw-strength-label" style={{ color: pwStrength.color }}>
                    {pwStrength.label}
                  </span>
                )}
              </div>
            )}
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className={`form-group ${errors.confirmPassword ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
          </div>

          {formData.role === 'Contractor' && (
            <AlertMessage
              type="info"
              message="Contractors require admin verification before submitting proposals."
            />
          )}

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button className="auth-link" onClick={() => navigate('login')}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
