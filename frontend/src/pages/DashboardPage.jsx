/*
 * DashboardPage.jsx
 * -----------------------------------------------
 * Role-specific dashboard landing page.
 * Demonstrates: useEffect for derived data calculations,
 * conditional rendering based on user role,
 * multiple useState, consuming multiple contexts.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData, useNav } from '../context/AppContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './DashboardPage.css';

// ── Homeowner Dashboard ────────────────────────────────────────────────────────

function HomeownerDashboard({ currentUser, projects, proposals, navigate }) {
  // Derived state computed with useEffect — runs whenever projects/proposals change
  const [stats, setStats] = useState({ total: 0, open: 0, accepted: 0, pending: 0 });

  useEffect(() => {
    const myProjects  = projects.filter((p) => p.homeowner_id === currentUser.user_id);
    const myProjectIds = myProjects.map((p) => p.project_id);
    const incomingProposals = proposals.filter((p) => myProjectIds.includes(p.project_id));

    setStats({
      total:    myProjects.length,
      open:     myProjects.filter((p) => p.status === 'Open').length,
      accepted: myProjects.filter((p) => p.status === 'Accepted').length,
      pending:  incomingProposals.filter((p) => p.status === 'Pending').length,
    });
  }, [projects, proposals, currentUser.user_id]);

  const recentProjects = projects
    .filter((p) => p.homeowner_id === currentUser.user_id)
    .slice(0, 3);

  return (
    <div className="dashboard-content">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <h1 className="dash-title">
          Good day, <span className="dash-name">{currentUser.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="dash-subtitle">Here's an overview of your renovation projects.</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon="📁" label="Total Projects"    value={stats.total}    accent="orange" />
        <StatCard icon="🟢" label="Open Projects"     value={stats.open}     accent="green"  />
        <StatCard icon="✅" label="Accepted Projects" value={stats.accepted} accent="blue"   />
        <StatCard icon="📋" label="Pending Proposals" value={stats.pending}  accent="purple" />
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn action-btn--primary" onClick={() => navigate('create-project')}>
            + Post New Project
          </button>
          <button className="action-btn" onClick={() => navigate('my-projects')}>
            My Projects
          </button>
          <button className="action-btn" onClick={() => navigate('browse')}>
            Browse All Projects
          </button>
        </div>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <h2 className="section-heading">Recent Projects</h2>
            <button className="view-all-link" onClick={() => navigate('my-projects')}>
              View all →
            </button>
          </div>
          <div className="recent-list">
            {recentProjects.map((p) => (
              <div key={p.project_id} className="recent-item">
                <div className="recent-item-left">
                  <div className="recent-item-title">{p.title}</div>
                  <div className="recent-item-meta">
                    📍 {p.location} &nbsp;·&nbsp; {p.proposal_count} proposal{p.proposal_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Contractor Dashboard ───────────────────────────────────────────────────────

function ContractorDashboard({ currentUser, projects, proposals, navigate }) {
  const [stats, setStats] = useState({ submitted: 0, pending: 0, accepted: 0, available: 0 });

  useEffect(() => {
    const myProposals = proposals.filter((p) => p.contractor_id === currentUser.user_id);
    setStats({
      submitted: myProposals.length,
      pending:   myProposals.filter((p) => p.status === 'Pending').length,
      accepted:  myProposals.filter((p) => p.status === 'Accepted').length,
      available: projects.filter((p) => p.status === 'Open').length,
    });
  }, [proposals, projects, currentUser.user_id]);

  return (
    <div className="dashboard-content">
      <div className="dashboard-greeting">
        <h1 className="dash-title">
          Welcome back, <span className="dash-name">{currentUser.name.split(' ')[0]}</span> 🔨
        </h1>
        <p className="dash-subtitle">
          {currentUser.is_verified
            ? 'Your profile is verified. Start bidding on projects!'
            : '⏳ Your contractor profile is pending admin verification.'}
        </p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📋" label="My Proposals"       value={stats.submitted} accent="orange" />
        <StatCard icon="⏳" label="Pending Bids"       value={stats.pending}  accent="purple" />
        <StatCard icon="✅" label="Accepted Proposals" value={stats.accepted} accent="green"  />
        <StatCard icon="🟢" label="Open Projects"      value={stats.available} accent="blue"  />
      </div>

      <div className="quick-actions">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn action-btn--primary" onClick={() => navigate('browse')}>
            Browse Open Projects
          </button>
          <button className="action-btn" onClick={() => navigate('my-proposals')}>
            My Proposals
          </button>
        </div>
      </div>

      {!currentUser.is_verified && (
        <div className="verification-notice">
          <span className="notice-icon">🔐</span>
          <div>
            <div className="notice-title">Verification Required</div>
            <div className="notice-body">
              Your contractor account is pending verification by an admin. You can still browse
              projects, but you need to be verified to submit proposals.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

function AdminDashboard({ projects, proposals, navigate }) {
  const [stats, setStats] = useState({ totalProjects: 0, openProjects: 0, totalProposals: 0, pendingProposals: 0 });

  useEffect(() => {
    setStats({
      totalProjects:   projects.length,
      openProjects:    projects.filter((p) => p.status === 'Open').length,
      totalProposals:  proposals.length,
      pendingProposals: proposals.filter((p) => p.status === 'Pending').length,
    });
  }, [projects, proposals]);

  return (
    <div className="dashboard-content">
      <div className="dashboard-greeting">
        <h1 className="dash-title">Admin <span className="dash-name">Control Panel</span> ⚙️</h1>
        <p className="dash-subtitle">Platform overview and management tools.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📁" label="Total Projects"     value={stats.totalProjects}    accent="orange" />
        <StatCard icon="🟢" label="Open Projects"      value={stats.openProjects}     accent="green"  />
        <StatCard icon="📋" label="Total Proposals"    value={stats.totalProposals}   accent="blue"   />
        <StatCard icon="⏳" label="Pending Proposals"  value={stats.pendingProposals} accent="purple" />
      </div>

      <div className="quick-actions">
        <h2 className="section-heading">Admin Tools</h2>
        <div className="action-buttons">
          <button className="action-btn action-btn--primary" onClick={() => navigate('admin')}>
            User Management
          </button>
          <button className="action-btn" onClick={() => navigate('browse')}>
            View All Projects
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { currentUser, isHomeowner, isContractor, isAdmin } = useAuth();
  const { projects, proposals } = useData();
  const { navigate } = useNav();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate a brief loading state to demonstrate useEffect + state transition
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);  // cleanup function — prevents memory leaks
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard…" />;
  }

  return (
    <div className="page-wrapper">
      {isHomeowner  && <HomeownerDashboard  currentUser={currentUser} projects={projects} proposals={proposals} navigate={navigate} />}
      {isContractor && <ContractorDashboard currentUser={currentUser} projects={projects} proposals={proposals} navigate={navigate} />}
      {isAdmin      && <AdminDashboard      projects={projects} proposals={proposals} navigate={navigate} />}
    </div>
  );
}
