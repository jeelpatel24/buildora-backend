/*
 * MyProposalsPage.jsx
 * -----------------------------------------------
 * Contractor's submitted proposals list.
 *
 * Sprint 3 changes:
 *   - proposals come from DataContext (already fetched from /api/proposals/my).
 *   - Each proposal row has project_title from the DB JOIN — no need to look up
 *     the project title separately from the projects list.
 *   - deleteProposal() in DataContext now calls DELETE /api/proposals/:id.
 *   - Loading state shown while DataContext is fetching on mount.
 */

import { useState, useEffect }    from 'react';
import { useData, useNav }        from '../context/AppContext';
import { useAuth }                from '../context/AuthContext';
import ProposalCard               from '../components/ProposalCard';
import AlertMessage               from '../components/AlertMessage';
import LoadingSpinner             from '../components/LoadingSpinner';
import './MyProposalsPage.css';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

export default function MyProposalsPage() {
  const { proposals, isLoading, deleteProposal } = useData();
  const { navigate }                             = useNav();
  const { currentUser }                          = useAuth();

  const [activeTab,       setActiveTab]       = useState('All');
  const [filteredList,    setFilteredList]    = useState([]);
  const [successMsg,      setSuccessMsg]      = useState('');
  const [errorMsg,        setErrorMsg]        = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(null);
  const [isWithdrawing,   setIsWithdrawing]   = useState(false);

  // Filter proposals belonging to this contractor by the active tab
  const myProposals = proposals.filter(p => p.contractor_id === currentUser?.user_id);

  useEffect(() => {
    setFilteredList(
      activeTab === 'All'
        ? myProposals
        : myProposals.filter(p => p.status === activeTab)
    );
  }, [proposals, activeTab]);

  async function executeWithdraw() {
    setIsWithdrawing(true);
    setErrorMsg('');
    try {
      await deleteProposal(confirmWithdraw.proposal_id);
      setConfirmWithdraw(null);
      setSuccessMsg('Proposal withdrawn successfully.');
    } catch (err) {
      setConfirmWithdraw(null);
      setErrorMsg(err.response?.data?.error || 'Failed to withdraw proposal. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  }

  const counts = {
    All:      myProposals.length,
    Pending:  myProposals.filter(p => p.status === 'Pending').length,
    Accepted: myProposals.filter(p => p.status === 'Accepted').length,
    Rejected: myProposals.filter(p => p.status === 'Rejected').length,
  };

  if (isLoading) return <LoadingSpinner message="Loading your proposals…" />;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">My Proposals</h1>
        <p className="page-subtitle">
          {myProposals.length} total &nbsp;·&nbsp;
          {counts.Pending} pending &nbsp;·&nbsp;
          {counts.Accepted} accepted
        </p>
      </div>

      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg   && <AlertMessage type="error"   message={errorMsg}   onClose={() => setErrorMsg('')}   />}

      {/* Status tabs */}
      <div className="proposals-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`proposals-tab ${activeTab === tab ? 'proposals-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span className="tab-count">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {myProposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No proposals submitted yet</h3>
          <p>Browse open projects and submit your first proposal.</p>
          <button className="browse-btn" onClick={() => navigate('browse')}>
            Browse Projects →
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <h3>No {activeTab.toLowerCase()} proposals</h3>
        </div>
      ) : (
        <div className="proposals-list">
          {filteredList.map(proposal => (
            <ProposalCard
              key={proposal.proposal_id}
              proposal={proposal}
              viewMode="contractor"
              projectTitle={proposal.project_title || 'Unknown Project'}
              onWithdraw={p => setConfirmWithdraw(p)}
            />
          ))}
        </div>
      )}

      {/* Withdraw confirmation modal */}
      {confirmWithdraw && (
        <div className="modal-overlay" onClick={() => !isWithdrawing && setConfirmWithdraw(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">Withdraw Proposal?</h3>
            <p className="confirm-body">
              Are you sure you want to withdraw your proposal for{' '}
              <strong>{confirmWithdraw.project_title || 'this project'}</strong>?
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-btn-cancel"
                onClick={() => setConfirmWithdraw(null)}
                disabled={isWithdrawing}
              >
                Keep Proposal
              </button>
              <button
                className="confirm-btn-confirm"
                onClick={executeWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? 'Withdrawing…' : 'Yes, Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
