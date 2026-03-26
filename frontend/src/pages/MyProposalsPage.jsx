/*
 * MyProposalsPage.jsx
 * -----------------------------------------------
 * Contractor's submitted proposals list.
 * Demonstrates: filtering with useEffect, grouping data,
 * conditional rendering for different proposal statuses,
 * callback-driven state updates.
 */

import { useState, useEffect } from 'react';
import { useAuth }             from '../context/AuthContext';
import { useData, useNav }     from '../context/AppContext';
import ProposalCard            from '../components/ProposalCard';
import AlertMessage            from '../components/AlertMessage';
import './MyProposalsPage.css';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

export default function MyProposalsPage() {
  const { currentUser }                    = useAuth();
  const { proposals, projects, deleteProposal } = useData();
  const { navigate }                       = useNav();

  const [myProposals,   setMyProposals]   = useState([]);
  const [activeTab,     setActiveTab]     = useState('All');
  const [filteredList,  setFilteredList]  = useState([]);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(null);

  // Derive my proposals
  useEffect(() => {
    const mine = proposals.filter((p) => p.contractor_id === currentUser.user_id);
    setMyProposals(mine);
  }, [proposals, currentUser.user_id]);

  // Apply tab filter
  useEffect(() => {
    if (activeTab === 'All') {
      setFilteredList(myProposals);
    } else {
      setFilteredList(myProposals.filter((p) => p.status === activeTab));
    }
  }, [myProposals, activeTab]);

  function getProjectTitle(projectId) {
    return projects.find((p) => p.project_id === projectId)?.title ?? 'Unknown Project';
  }

  function handleWithdraw(proposal) {
    setConfirmWithdraw(proposal);
  }

  function executeWithdraw() {
    deleteProposal(confirmWithdraw.proposal_id);
    setConfirmWithdraw(null);
    setSuccessMsg('Proposal withdrawn successfully.');
  }

  // Tab counts
  const counts = {
    All:      myProposals.length,
    Pending:  myProposals.filter((p) => p.status === 'Pending').length,
    Accepted: myProposals.filter((p) => p.status === 'Accepted').length,
    Rejected: myProposals.filter((p) => p.status === 'Rejected').length,
  };

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

      {successMsg && (
        <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
      )}

      {/* Status tabs */}
      <div className="proposals-tabs">
        {STATUS_TABS.map((tab) => (
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

      {/* Content */}
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
          {filteredList.map((proposal) => (
            <ProposalCard
              key={proposal.proposal_id}
              proposal={proposal}
              viewMode="contractor"
              projectTitle={getProjectTitle(proposal.project_id)}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      )}

      {/* Withdraw confirmation */}
      {confirmWithdraw && (
        <div className="modal-overlay" onClick={() => setConfirmWithdraw(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Withdraw Proposal?</h3>
            <p className="confirm-body">
              Are you sure you want to withdraw your proposal for{' '}
              <strong>{getProjectTitle(confirmWithdraw.project_id)}</strong>?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={() => setConfirmWithdraw(null)}>
                Keep Proposal
              </button>
              <button className="confirm-btn-confirm" onClick={executeWithdraw}>
                Yes, Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
