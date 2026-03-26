/*
 * ProjectDetailPage.jsx
 * -----------------------------------------------
 * Full project detail view with inline proposal submission form.
 * Demonstrates: useEffect for loading derived data, useState for
 * modal/form toggle, controlled form for proposal submission,
 * conditional rendering based on role & project state.
 */

import { useState, useEffect } from 'react';
import { useAuth }             from '../context/AuthContext';
import { useData, useNav }     from '../context/AppContext';
import ProposalCard            from '../components/ProposalCard';
import AlertMessage            from '../components/AlertMessage';
import LoadingSpinner          from '../components/LoadingSpinner';
import './ProjectDetailPage.css';

function formatCurrency(v) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

// Inline proposal submission form — controlled
function ProposalForm({ projectId, contractorId, contractorName, onSubmit, onCancel }) {
  const [formData, setFormData]   = useState({ proposed_price: '', message: '' });
  const [errors,   setErrors]     = useState({});
  const [success,  setSuccess]    = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const e = {};
    const price = parseFloat(formData.proposed_price);
    if (!formData.proposed_price) {
      e.proposed_price = 'Proposed price is required.';
    } else if (isNaN(price) || price <= 0) {
      e.proposed_price = 'Please enter a valid price greater than 0.';
    }
    if (!formData.message.trim()) {
      e.message = 'Please include a message to the homeowner.';
    } else if (formData.message.trim().length < 20) {
      e.message = 'Message should be at least 20 characters.';
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({
      project_id:     projectId,
      contractor_id:  contractorId,
      contractor_name: contractorName,
      proposed_price: parseFloat(formData.proposed_price),
      message:        formData.message.trim(),
    });
    setSuccess(true);
  }

  if (success) {
    return (
      <AlertMessage
        type="success"
        message="Your proposal has been submitted successfully! The homeowner will review it shortly."
      />
    );
  }

  return (
    <form className="proposal-form" onSubmit={handleSubmit} noValidate>
      <h3 className="proposal-form-title">Submit Your Proposal</h3>

      {/* Price */}
      <div className={`form-group ${errors.proposed_price ? 'form-group--error' : ''}`}>
        <label className="form-label" htmlFor="proposed_price">Your Proposed Price (CAD)</label>
        <div className="price-input-wrap">
          <span className="price-prefix">$</span>
          <input
            id="proposed_price"
            name="proposed_price"
            type="number"
            min="1"
            step="100"
            className="form-input price-input"
            placeholder="e.g. 18500"
            value={formData.proposed_price}
            onChange={handleChange}
          />
        </div>
        {errors.proposed_price && <span className="form-error">{errors.proposed_price}</span>}
      </div>

      {/* Message */}
      <div className={`form-group ${errors.message ? 'form-group--error' : ''}`}>
        <label className="form-label" htmlFor="proposal-message">
          Cover Message
          <span className="form-hint"> ({formData.message.length}/500)</span>
        </label>
        <textarea
          id="proposal-message"
          name="message"
          className="form-input"
          rows="5"
          placeholder="Introduce yourself, describe your experience, and explain why you're the right fit for this project…"
          value={formData.message}
          onChange={handleChange}
          maxLength={500}
        />
        {errors.message && <span className="form-error">{errors.message}</span>}
      </div>

      <div className="proposal-form-actions">
        <button type="submit" className="btn-submit-proposal">Submit Proposal</button>
        <button type="button" className="btn-cancel-proposal" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { currentUser, isHomeowner, isContractor } = useAuth();
  const { projects, proposals, addProposal, acceptProposal } = useData();
  const { pageParams, navigate } = useNav();

  const [project,          setProject]          = useState(null);
  const [projectProposals, setProjectProposals] = useState([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [hasSubmitted,     setHasSubmitted]     = useState(false);
  const [successMsg,       setSuccessMsg]       = useState('');
  const [isLoading,        setIsLoading]        = useState(true);

  // Load project and its proposals from context
  useEffect(() => {
    const found = projects.find((p) => p.project_id === pageParams.projectId);
    setProject(found || null);

    if (found) {
      setProjectProposals(proposals.filter((p) => p.project_id === found.project_id));
      // Check if current contractor already submitted
      if (isContractor) {
        const submitted = proposals.some(
          (p) => p.project_id === found.project_id && p.contractor_id === currentUser.user_id
        );
        setHasSubmitted(submitted);
      }
    }

    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [projects, proposals, pageParams.projectId, isContractor, currentUser]);

  function handleSubmitProposal(proposalData) {
    addProposal(proposalData);
    setHasSubmitted(true);
    setShowProposalForm(false);
    setSuccessMsg('Your proposal was submitted! You can view it in "My Proposals".');
  }

  function handleAcceptProposal(proposal) {
    acceptProposal(proposal.proposal_id, proposal.project_id);
    setSuccessMsg(`Proposal from ${proposal.contractor_name} accepted! Project is now closed to new bids.`);
  }

  if (isLoading) return <LoadingSpinner message="Loading project…" />;

  if (!project) {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <h3>Project not found</h3>
          <button className="pd-back-btn" onClick={() => navigate('browse')}>← Back to Projects</button>
        </div>
      </div>
    );
  }

  const canSubmitProposal =
    isContractor &&
    currentUser?.is_verified &&
    project.status === 'Open' &&
    !hasSubmitted;

  return (
    <div className="page-wrapper">
      {/* Back button */}
      <button className="pd-back-btn" onClick={() => navigate('browse')}>
        ← Back to Projects
      </button>

      <div className="pd-layout">
        {/* ── Left: Project info ── */}
        <div className="pd-main">
          {/* Header */}
          <div className="pd-header">
            <div className="pd-header-top">
              <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
              <span className="pd-date">Posted {formatDate(project.created_at)}</span>
            </div>
            <h1 className="pd-title">{project.title}</h1>
            <p className="pd-homeowner">by {project.homeowner_name}</p>
          </div>

          {/* Meta strip */}
          <div className="pd-meta-strip">
            <div className="pd-meta-item">
              <span className="pd-meta-label">📍 Location</span>
              <span className="pd-meta-value">{project.location}</span>
            </div>
            <div className="pd-meta-item">
              <span className="pd-meta-label">💰 Budget Range</span>
              <span className="pd-meta-value">
                {formatCurrency(project.budget_min)} – {formatCurrency(project.budget_max)}
              </span>
            </div>
            <div className="pd-meta-item">
              <span className="pd-meta-label">📋 Proposals</span>
              <span className="pd-meta-value">{project.proposal_count}</span>
            </div>
          </div>

          {/* Description */}
          <div className="pd-section">
            <h2 className="pd-section-title">Project Description</h2>
            <p className="pd-description">{project.description}</p>
          </div>

          {/* Success message */}
          {successMsg && (
            <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
          )}

          {/* Contractor: proposal form or status */}
          {isContractor && (
            <div className="pd-section">
              {canSubmitProposal && !showProposalForm && (
                <button
                  className="pd-submit-proposal-btn"
                  onClick={() => setShowProposalForm(true)}
                >
                  📝 Submit a Proposal
                </button>
              )}

              {canSubmitProposal && showProposalForm && (
                <ProposalForm
                  projectId={project.project_id}
                  contractorId={currentUser.user_id}
                  contractorName={currentUser.name}
                  onSubmit={handleSubmitProposal}
                  onCancel={() => setShowProposalForm(false)}
                />
              )}

              {hasSubmitted && !successMsg && (
                <AlertMessage
                  type="info"
                  message="You have already submitted a proposal for this project."
                />
              )}

              {!currentUser?.is_verified && (
                <AlertMessage
                  type="warning"
                  message="Your account must be verified by an admin before you can submit proposals."
                />
              )}

              {project.status !== 'Open' && (
                <AlertMessage
                  type="info"
                  message="This project is no longer accepting proposals."
                />
              )}
            </div>
          )}
        </div>

        {/* ── Right: Proposals (homeowner view) ── */}
        {isHomeowner && project.homeowner_id === currentUser.user_id && (
          <aside className="pd-proposals-panel">
            <h2 className="pd-section-title">
              Proposals ({projectProposals.length})
            </h2>

            {projectProposals.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon" style={{ fontSize: '1.8rem' }}>📭</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-dim)' }}>
                  No proposals yet. Share your project to attract contractors!
                </p>
              </div>
            ) : (
              <div className="proposals-list">
                {projectProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.proposal_id}
                    proposal={proposal}
                    viewMode="homeowner"
                    onAccept={project.status === 'Open' ? handleAcceptProposal : null}
                  />
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
