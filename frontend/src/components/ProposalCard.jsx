/*
 * ProposalCard.jsx
 * -----------------------------------------------
 * Displays a single proposal with accept/withdraw actions.
 * Demonstrates: props, conditional rendering based on multiple
 * prop values, event handler props (callbacks).
 */

import './ProposalCard.css';

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

function StatusBadge({ status }) {
  const cls = {
    Pending:  'badge-pending',
    Accepted: 'badge-accepted',
    Rejected: 'badge-rejected',
  }[status] || '';

  return <span className={`badge ${cls}`}>{status}</span>;
}

// viewMode: 'homeowner' (sees contractor details + accept button)
//           'contractor' (sees their own proposals + withdraw)
export default function ProposalCard({
  proposal,
  viewMode = 'homeowner',
  onAccept,
  onWithdraw,
  projectTitle,
}) {
  const {
    contractor_name,
    proposed_price,
    message,
    status,
    created_at,
  } = proposal;

  return (
    <article className={`proposal-card proposal-card--${status.toLowerCase()}`}>
      <div className="prpc-header">
        <div className="prpc-left">
          {viewMode === 'homeowner' && (
            <div className="prpc-avatar">{contractor_name?.[0] ?? 'C'}</div>
          )}
          <div>
            {viewMode === 'homeowner' && (
              <div className="prpc-name">{contractor_name}</div>
            )}
            {viewMode === 'contractor' && projectTitle && (
              <div className="prpc-project-title">{projectTitle}</div>
            )}
            <div className="prpc-date">{formatDate(created_at)}</div>
          </div>
        </div>
        <div className="prpc-right">
          <div className="prpc-price">{formatCurrency(proposed_price)}</div>
          <StatusBadge status={status} />
        </div>
      </div>

      <p className="prpc-message">{message}</p>

      {/* Actions */}
      {status === 'Pending' && (
        <div className="prpc-actions">
          {viewMode === 'homeowner' && onAccept && (
            <button className="prpc-btn-accept" onClick={() => onAccept(proposal)}>
              ✓ Accept Proposal
            </button>
          )}
          {viewMode === 'contractor' && onWithdraw && (
            <button className="prpc-btn-withdraw" onClick={() => onWithdraw(proposal)}>
              Withdraw
            </button>
          )}
        </div>
      )}

      {status === 'Accepted' && (
        <div className="prpc-accepted-banner">
          ✓ This proposal has been accepted
        </div>
      )}
    </article>
  );
}
