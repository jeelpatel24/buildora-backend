/*
 * CreateProjectPage.jsx
 * -----------------------------------------------
 * Multi-field form for posting a new renovation project.
 *
 * Sprint 3 changes:
 *   - addProject() is now async (calls POST /api/projects via DataContext).
 *   - API errors are extracted from error.response.data.error.
 *   - Loading state disables the submit button while the request is in flight.
 *   - Location field uses OpenStreetMap Nominatim API for real-address autocomplete.
 *     Only addresses confirmed from the suggestion list are accepted.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useData, useNav }                           from '../context/AppContext';
import AlertMessage                                  from '../components/AlertMessage';
import './CreateProjectPage.css';

const INITIAL_FORM = {
  title: '', description: '', location: '', budget_min: '', budget_max: '',
};

const BUDGET_PRESETS = [
  { label: '< $5K',   min: 1000,  max: 5000  },
  { label: '$5–15K',  min: 5000,  max: 15000 },
  { label: '$15–30K', min: 15000, max: 30000 },
  { label: '$30–60K', min: 30000, max: 60000 },
  { label: '$60K+',   min: 60000, max: 120000 },
];

function formatCurrency(v) {
  if (!v) return '—';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
  }).format(v);
}

/* ── Location Autocomplete Hook ── */
function useLocationAutocomplete() {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [validated,   setValidated]   = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((value) => {
    setQuery(value);
    setValidated(false);

    clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(value)}` +
          `&format=json&addressdetails=1&limit=6` +
          `&featuretype=city,town,municipality,suburb,county`;
        const res  = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();

        // Build clean display labels
        const results = data.map((item) => {
          const a    = item.address || {};
          const city = a.city || a.town || a.village || a.municipality || a.county || '';
          const prov = a.state || a.province || '';
          const country = a.country_code?.toUpperCase() || '';
          const label = [city, prov, country].filter(Boolean).join(', ') || item.display_name.split(',').slice(0, 3).join(',').trim();
          return { id: item.place_id, label, full: item.display_name };
        });

        // Deduplicate by label
        const seen = new Set();
        const unique = results.filter(r => {
          if (seen.has(r.label)) return false;
          seen.add(r.label);
          return true;
        });

        setSuggestions(unique.slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 380);
  }, []);

  function pick(label) {
    setQuery(label);
    setValidated(true);
    setSuggestions([]);
  }

  function clear() {
    setQuery('');
    setValidated(false);
    setSuggestions([]);
    clearTimeout(debounceRef.current);
  }

  return { query, suggestions, isSearching, validated, search, pick, clear };
}

/* ── Page Component ── */

export default function CreateProjectPage() {
  const { addProject } = useData();
  const { navigate }   = useNav();

  const [formData,    setFormData]    = useState(INITIAL_FORM);
  const [errors,      setErrors]      = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [charCount,   setCharCount]   = useState(0);

  const loc = useLocationAutocomplete();
  const locWrapRef = useRef(null);

  // Sync location autocomplete value into formData
  useEffect(() => {
    setFormData(prev => ({ ...prev, location: loc.query }));
  }, [loc.query]);

  useEffect(() => {
    setCharCount(formData.description.length);
  }, [formData.description]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (locWrapRef.current && !locWrapRef.current.contains(e.target)) {
        loc.clear();
        // restore whatever was typed if not validated
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [loc]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'location') {
      loc.search(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function applyBudgetPreset(preset) {
    setFormData(prev => ({
      ...prev,
      budget_min: String(preset.min),
      budget_max: String(preset.max),
    }));
    setErrors(prev => ({ ...prev, budget_min: '', budget_max: '' }));
  }

  function validate() {
    const e = {};
    if (!formData.title.trim())                   e.title = 'Project title is required.';
    else if (formData.title.trim().length < 5)    e.title = 'Title must be at least 5 characters.';
    else if (formData.title.trim().length > 200)  e.title = 'Title cannot exceed 200 characters.';

    if (!formData.description.trim())             e.description = 'Description is required.';
    else if (formData.description.trim().length < 30) e.description = 'Please provide at least 30 characters of detail.';

    if (!loc.query.trim())      e.location = 'Location is required.';
    else if (!loc.validated)    e.location = 'Please select an address from the suggestions.';

    const min = parseFloat(formData.budget_min);
    const max = parseFloat(formData.budget_max);
    if (!formData.budget_min)           e.budget_min = 'Minimum budget is required.';
    else if (isNaN(min) || min <= 0)    e.budget_min = 'Enter a valid minimum budget.';
    if (!formData.budget_max)           e.budget_max = 'Maximum budget is required.';
    else if (isNaN(max) || max <= 0)    e.budget_max = 'Enter a valid maximum budget.';
    else if (!isNaN(min) && max <= min) e.budget_max = 'Maximum must be greater than minimum.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      document.querySelector('.form-group--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsLoading(true);
    try {
      await addProject({
        title:       formData.title.trim(),
        description: formData.description.trim(),
        location:    loc.query.trim(),
        budget_min:  parseFloat(formData.budget_min),
        budget_max:  parseFloat(formData.budget_max),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="page-wrapper">
        <div className="create-success">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Project Posted!</h2>
          <p className="success-body">
            Your renovation project <strong>"{formData.title}"</strong> is now live
            and visible to verified contractors.
          </p>
          <div className="success-actions">
            <button className="success-btn-primary" onClick={() => navigate('my-projects')}>
              View My Projects
            </button>
            <button
              className="success-btn-secondary"
              onClick={() => { setFormData(INITIAL_FORM); loc.clear(); setSubmitted(false); }}
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

      {submitError && (
        <AlertMessage type="error" message={submitError} onClose={() => setSubmitError('')} />
      )}

      <div className="create-layout">
        <form className="create-form" onSubmit={handleSubmit} noValidate>

          {/* Title */}
          <div className={`form-group ${errors.title ? 'form-group--error' : ''}`}>
            <label className="form-label" htmlFor="title">
              Project Title <span className="required">*</span>
            </label>
            <input
              id="title" name="title" type="text"
              className="form-input" placeholder="e.g. Full Kitchen Renovation"
              value={formData.title} onChange={handleChange} maxLength={200}
              disabled={isLoading}
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
              id="description" name="description"
              className="form-input" rows="6"
              placeholder="Describe the scope of work, materials, timeline, and any specific requirements…"
              value={formData.description} onChange={handleChange} maxLength={2000}
              disabled={isLoading}
            />
            <span className="form-hint">{charCount}/2000 characters</span>
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          {/* Location — real-address autocomplete */}
          <div className={`form-group ${errors.location ? 'form-group--error' : ''}`} ref={locWrapRef}>
            <label className="form-label" htmlFor="location">
              Location <span className="required">*</span>
            </label>
            <div className="loc-input-wrap">
              <span className="loc-pin-icon">📍</span>
              <input
                id="location" name="location" type="text"
                className="form-input loc-input"
                placeholder="Start typing a city or address…"
                value={loc.query}
                onChange={handleChange}
                autoComplete="off"
                disabled={isLoading}
              />
              {loc.validated && (
                <span className="loc-verified-badge" title="Address verified">✓</span>
              )}
              {loc.isSearching && <span className="loc-spinner" />}
            </div>

            {/* Suggestions dropdown */}
            {loc.suggestions.length > 0 && (
              <ul className="loc-suggestions">
                {loc.suggestions.map((s) => (
                  <li
                    key={s.id}
                    className="loc-suggestion-item"
                    onMouseDown={() => {
                      loc.pick(s.label);
                      setErrors(prev => ({ ...prev, location: '' }));
                    }}
                  >
                    <span className="loc-suggestion-icon">📍</span>
                    <div>
                      <div className="loc-suggestion-label">{s.label}</div>
                      <div className="loc-suggestion-full">{s.full.split(',').slice(0, 4).join(',')}</div>
                    </div>
                  </li>
                ))}
                <li className="loc-suggestions-footer">
                  Powered by OpenStreetMap
                </li>
              </ul>
            )}

            <span className="form-hint">
              {loc.validated
                ? '✓ Address verified from OpenStreetMap'
                : 'Type at least 3 characters to see real address suggestions'}
            </span>
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>

          {/* Budget */}
          <div className="form-group">
            <label className="form-label">
              Budget Range (CAD) <span className="required">*</span>
            </label>
            <div className="budget-presets">
              {BUDGET_PRESETS.map(p => (
                <button
                  key={p.label} type="button"
                  className={`budget-preset ${
                    formData.budget_min === String(p.min) && formData.budget_max === String(p.max)
                      ? 'budget-preset--active' : ''
                  }`}
                  onClick={() => applyBudgetPreset(p)}
                  disabled={isLoading}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="form-row">
              <div className={`form-group ${errors.budget_min ? 'form-group--error' : ''}`}>
                <label className="form-label" htmlFor="budget_min">Minimum ($)</label>
                <input
                  id="budget_min" name="budget_min" type="number"
                  min="0" step="500" className="form-input" placeholder="e.g. 10000"
                  value={formData.budget_min} onChange={handleChange} disabled={isLoading}
                />
                {errors.budget_min && <span className="form-error">{errors.budget_min}</span>}
              </div>
              <div className={`form-group ${errors.budget_max ? 'form-group--error' : ''}`}>
                <label className="form-label" htmlFor="budget_max">Maximum ($)</label>
                <input
                  id="budget_max" name="budget_max" type="number"
                  min="0" step="500" className="form-input" placeholder="e.g. 20000"
                  value={formData.budget_max} onChange={handleChange} disabled={isLoading}
                />
                {errors.budget_max && <span className="form-error">{errors.budget_max}</span>}
              </div>
            </div>
          </div>

          <div className="create-form-footer">
            <button type="button" className="create-cancel-btn" onClick={() => navigate('my-projects')} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="create-submit-btn" disabled={isLoading}>
              {isLoading ? 'Posting…' : 'Post Project →'}
            </button>
          </div>
        </form>

        {/* Live preview */}
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
              {loc.query && (
                <span>
                  📍 {loc.query}
                  {loc.validated && <span className="preview-verified"> ✓</span>}
                </span>
              )}
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
