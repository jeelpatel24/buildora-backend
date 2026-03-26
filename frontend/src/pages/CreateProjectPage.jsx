/*
 * CreateProjectPage.jsx
 * -----------------------------------------------
 * Multi-field form for creating a new renovation project.
 * Demonstrates: controlled inputs, complex validation, useState,
 * range input, form submission, success state, useEffect cleanup.
 */

import { useState, useEffect } from 'react';
import { useAuth }             from '../context/AuthContext';
import { useData, useNav }     from '../context/AppContext';
import AlertMessage            from '../components/AlertMessage';
import './CreateProjectPage.css';

const INITIAL_FORM = {
  title:       '',
  description: '',
  location:    '',
  budget_min:  '',
  budget_max:  '',
};

// Budget slider labels
const BUDGET_PRESETS = [
  { label: '< $5K',   min: 1000,  max: 5000  },
  { label: '$5–15K',  min: 5000,  max: 15000 },
  { label: '$15–30K', min: 15000, max: 30000 },
  { label: '$30–60K', min: 30000, max: 60000 },
  { label: '$60K+',   min: 60000, max: 120000 },
];

function formatCurrency(v) {
  if (!v) return '—';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v);
}

export default function CreateProjectPage() {
  const { currentUser } = useAuth();
  const { addProject }  = useData();
  const { navigate }    = useNav();

  const [formData,   setFormData]   = useState(INITIAL_FORM);
  const [errors,     setErrors]     = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [charCount,  setCharCount]  = useState(0);

  // useEffect to keep desc character count in sync — demonstrates side effect
  useEffect(() => {
    setCharCount(formData.description.length);
  }, [formData.description]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function applyBudgetPreset(preset) {
    setFormData((prev) => ({
      ...prev,
      budget_min: String(preset.min),
      budget_max: String(preset.max),
    }));
    setErrors((prev) => ({ ...prev, budget_min: '', budget_max: '' }));
  }

  function validate() {
    const e = {};

    if (!formData.title.trim()) {
      e.title = 'Project title is required.';
    } else if (formData.title.trim().length < 5) {
      e.title = 'Title must be at least 5 characters.';
    } else if (formData.title.trim().length > 200) {
      e.title = 'Title cannot exceed 200 characters.';
    }

    if (!formData.description.trim()) {
      e.description = 'Description is required.';
    } else if (formData.description.trim().length < 30) {
      e.description = 'Please provide at least 30 characters of detail.';
    }

    if (!formData.location.trim()) {
      e.location = 'Location is required (e.g. Toronto, ON).';
    }

    const min = parseFloat(formData.budget_min);
    const max = parseFloat(formData.budget_max);

    if (!formData.budget_min) {
      e.budget_min = 'Minimum budget is required.';
    } else if (isNaN(min) || min <= 0) {
      e.budget_min = 'Enter a valid minimum budget.';
    }

    if (!formData.budget_max) {
      e.budget_max = 'Maximum budget is required.';
    } else if (isNaN(max) || max <= 0) {
      e.budget_max = 'Enter a valid maximum budget.';
    } else if (!isNaN(min) && max <= min) {
      e.budget_max = 'Maximum budget must be greater than minimum.';
    }

    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorEl = document.querySelector('.form-group--error');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      addProject({
        homeowner_id:   currentUser.user_id,
        homeowner_name: currentUser.name,
        title:          formData.title.trim(),
        description:    formData.description.trim(),
        location:       formData.location.trim(),
        budget_min:     parseFloat(formData.budget_min),
        budget_max:     parseFloat(formData.budget_max),
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
  }

  // Success screen
  if (submitted) {
    return (
      <div className="page-wrapper">
        <div className="create-success">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Project Posted!</h2>
          <p className="success-body">
            Your renovation project <strong>"{formData.title}"</strong> is now live and visible to
            verified contractors.
          </p>
          <div className="success-actions">
            <button className="success-btn-primary" onClick={() => navigate('my-projects')}>
              View My Projects
            </button>
            <button
              className="success-btn-secondary"
              onClick={() => { setFormData(INITIAL_FORM); setSubmitted(false); }}
            >
              Post Another Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Post a New Project</h1>
        <p className="page-subtitle">
          Fill in the details below so contractors can find and bid on your project.
        </p>
      </div>

      {submitError && <AlertMessage type="error" message={submitError} onClose={() => setSubmitError('')} />}

      <div className="create-layout">
        <form className="create-form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className={`form-group ${errors.title ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="title">
              Project Title <span className="required">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g. Full Kitchen Renovation"
              value={formData.title}
              onChange={handleChange}
              maxLength={200}
            />
            <span className="form-hint">{formData.title.length}/200</span>
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className={`form-group ${errors.description ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              rows="6"
              placeholder="Describe the scope of work, materials, timeline expectations, and any specific requirements…"
              value={formData.description}
              onChange={handleChange}
              maxLength={2000}
            />
            <span className="form-hint">{charCount}/2000 characters</span>
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          {/* Location */}
          <div className={`form-group ${errors.location ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="location">
              Location <span className="required">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="form-input"
              placeholder="e.g. Toronto, ON"
              value={formData.location}
              onChange={handleChange}
            />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>

          {/* Budget */}
          <div className="form-group">
            <label className="form-label">
              Budget Range (CAD) <span className="required">*</span>
            </label>
            {/* Quick preset buttons */}
            <div className="budget-presets">
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`budget-preset ${
                    formData.budget_min === String(p.min) && formData.budget_max === String(p.max)
                      ? 'budget-preset--active'
                      : ''
                  }`}
                  onClick={() => applyBudgetPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="form-row">
              <div className={`form-group ${errors.budget_min ? 'form-group--error' : ''}`}>
                <label className="form-label" htmlFor="budget_min">Minimum ($)</label>
                <input
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  min="0"
                  step="500"
                  className="form-input"
                  placeholder="e.g. 10000"
                  value={formData.budget_min}
                  onChange={handleChange}
                />
                {errors.budget_min && <span className="form-error">{errors.budget_min}</span>}
              </div>
              <div className={`form-group ${errors.budget_max ? 'form-group--error' : ''}`}>
                <label className="form-label" htmlFor="budget_max">Maximum ($)</label>
                <input
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  min="0"
                  step="500"
                  className="form-input"
                  placeholder="e.g. 20000"
                  value={formData.budget_max}
                  onChange={handleChange}
                />
                {errors.budget_max && <span className="form-error">{errors.budget_max}</span>}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="create-form-footer">
            <button type="button" className="create-cancel-btn" onClick={() => navigate('my-projects')}>
              Cancel
            </button>
            <button type="submit" className="create-submit-btn">
              Post Project →
            </button>
          </div>
        </form>

        {/* Live preview sidebar */}
        <div className="create-preview">
          <div className="preview-label">Live Preview</div>
          <div className="preview-card">
            <div className="preview-status badge badge-open">● Open</div>
            <h3 className="preview-title">{formData.title || 'Your project title…'}</h3>
            <p className="preview-desc">
              {formData.description
                ? formData.description.slice(0, 120) + (formData.description.length > 120 ? '…' : '')
                : 'Your project description will appear here…'}
            </p>
            <div className="preview-meta">
              {formData.location && <span>📍 {formData.location}</span>}
              {formData.budget_min && formData.budget_max && (
                <span>💰 {formatCurrency(formData.budget_min)} – {formatCurrency(formData.budget_max)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
