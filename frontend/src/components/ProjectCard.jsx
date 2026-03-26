/*
 * ProjectCard.jsx
 * -----------------------------------------------
 * Displays a single renovation project in card format.
 * Demonstrates: props destructuring, conditional rendering,
 * prop-driven callbacks, computed values from props.
 */

import './ProjectCard.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-CA', {
    style:    'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  }).format(new Date(iso));
}

// Sub-component for the status badge
function StatusBadge({ status }) {
  const cls = {
    Open:     'badge-open',
    Accepted: 'badge-accepted',
    Closed:   'badge-closed',
  }[status] || '';

  const dot = {
    Open:     '●',
    Accepted: '✓',
    Closed:   '○',
  }[status];

  return (
    <span className={`badge ${cls}`}>
      {dot} {status}
    </span>
  );
}

export default function ProjectCard({ project, onView, onEdit, onDelete, viewMode = 'browse' }) {
  const {
    title,
    description,
    budget_min,
    budget_max,
    location,
    status,
    created_at,
    proposal_count = 0,
    homeowner_name,
  } = project;

  const budgetRange = `${formatCurrency(budget_min)} – ${formatCurrency(budget_max)}`;
  const shortDesc   = description.length > 130 ? description.slice(0, 130) + '…' : description;

  return (
    <article className="project-card">
      {/* Header row */}
      <div className="pc-header">
        <StatusBadge status={status} />
        <span className="pc-date">{formatDate(created_at)}</span>
      </div>

      {/* Title */}
      <h3 className="pc-title">{title}</h3>

      {/* Description */}
      <p className="pc-description">{shortDesc}</p>

      {/* Meta info */}
      <div className="pc-meta">
        <div className="pc-meta-item">
          <span className="pc-meta-icon">📍</span>
          <span>{location}</span>
        </div>
        <div className="pc-meta-item">
          <span className="pc-meta-icon">💰</span>
          <span>{budgetRange}</span>
        </div>
        {viewMode === 'my-projects' && (
          <div className="pc-meta-item">
            <span className="pc-meta-icon">📋</span>
            <span>{proposal_count} proposal{proposal_count !== 1 ? 's' : ''}</span>
          </div>
        )}
        {viewMode === 'browse' && homeowner_name && (
          <div className="pc-meta-item">
            <span className="pc-meta-icon">👤</span>
            <span>{homeowner_name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pc-actions">
        <button className="pc-btn-primary" onClick={() => onView?.(project)}>
          View Details
        </button>

        {viewMode === 'my-projects' && (
          <>
            <button className="pc-btn-secondary" onClick={() => onEdit?.(project)}>
              Edit
            </button>
            {status === 'Open' && (
              <button className="pc-btn-danger" onClick={() => onDelete?.(project)}>
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}
