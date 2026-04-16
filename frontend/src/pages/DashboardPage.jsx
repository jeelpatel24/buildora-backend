/*
 * DashboardPage.jsx
 * -----------------------------------------------
 * Role-specific dashboard landing page.
 *
 * Sprint 3 changes:
 *   - HomeownerDashboard fetches its own project data from GET /api/projects/my
 *     so that proposal_count totals are accurate (not available in browse list).
 *   - ContractorDashboard reads proposals from DataContext (already fetched by
 *     DataProvider on login) and open projects from DataContext as well.
 *   - AdminDashboard calls GET /api/admin/stats for real platform numbers.
 *
 * Demonstrates: useEffect for data fetching, async/await, loading states,
 * multiple useState, consuming both API functions and shared Context.
 */

import { useState, useEffect } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useData, useNav } from '../context/AppContext';
import { getMyProjects }   from '../api/projects';
import { getMyProposals }  from '../api/proposals';
import { getAdminStats }   from '../api/admin';
import StatCard        from '../components/StatCard';
import LoadingSpinner  from '../components/LoadingSpinner';
import './DashboardPage.css';

// ── Homeowner Dashboard ────────────────────────────────────────────────────────

function HomeownerDashboard({ currentUser, navigate }) {
  const [projects,  setProjects]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats,     setStats]     = useState({ total: 0, open: 0, accepted: 0, totalProposals: 0 });

  // Fetch this homeowner's projects from the API on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getMyProjects();
        const mine = data.projects || [];
        setProjects(mine);
        setStats({
          total:          mine.length,
          open:           mine.filter(p => p.status === 'Open').length,
          accepted:       mine.filter(p => p.status === 'Accepted').length,
          totalProposals: mine.reduce((sum, p) => sum + parseInt(p.proposal_count || 0, 10), 0),
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (isLoading) return <LoadingSpinner message="Loading your dashboard…" />;

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="dashboard-content">
      <div className="dashboard-greeting">
        <h1 className="dash-title">
          Good day, <span className="dash-name">{currentUser.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="dash-subtitle">Here's an overview of your renovation projects.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📁" label="Total Projects"       value={stats.total}          accent="orange" />
        <StatCard icon="🟢" label="Open Projects"        value={stats.open}           accent="green"  />
        <StatCard icon="✅" label="Accepted Projects"    value={stats.accepted}       accent="blue"   />
        <StatCard icon="📋" label="Proposals Received"   value={stats.totalProposals} accent="purple" />
      </div>

      <div className="quick-actions">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn action-btn--primary" onClick={() => navigate('create-project')}>
            + Post New Project
          </button>
          <button className="action-btn" onClick={() => navigate('my-projects')}>My Projects</button>
          <button className="action-btn" onClick={() => navigate('browse')}>Browse All Projects</button>
        </div>
      </div>

      {recentProjects.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <h2 className="section-heading">Recent Projects</h2>
            <button className="view-all-link" onClick={() => navigate('my-projects')}>View all →</button>
          </div>
          <div className="recent-list">
            {recentProjects.map(p => (
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

function ContractorDashboard({ currentUser, navigate }) {
  const { projects, proposals } = useData();
  const [myProposals, setMyProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      try {
        const data = await getMyProposals();
        setMyProposals(data.proposals || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProposals();
  }, []);

  if (isLoading) return <LoadingSpinner message="Loading your dashboard…" />;

  const stats = {
    submitted: myProposals.length,
    pending:   myProposals.filter(p => p.status === 'Pending').length,
    accepted:  myProposals.filter(p => p.status === 'Accepted').length,
    available: projects.length, // all entries in DataContext.projects are Open
  };

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
        <StatCard icon="📋" label="My Proposals"        value={stats.submitted} accent="orange" />
        <StatCard icon="⏳" label="Pending Bids"        value={stats.pending}   accent="purple" />
        <StatCard icon="✅" label="Accepted Proposals"  value={stats.accepted}  accent="green"  />
        <StatCard icon="🟢" label="Open Projects"       value={stats.available} accent="blue"   />
      </div>

      <div className="quick-actions">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn action-btn--primary" onClick={() => navigate('browse')}>
            Browse Open Projects
          </button>
          <button className="action-btn" onClick={() => navigate('my-proposals')}>My Proposals</button>
        </div>
      </div>

      {!currentUser.is_verified && (
        <div className="verification-notice">
          <span className="notice-icon">🔐</span>
          <div>
            <div className="notice-title">Verification Required</div>
            <div className="notice-body">
              Your contractor account is pending verification by an admin. You can browse
              projects, but you must be verified before submitting proposals.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

function AdminDashboard({ navigate }) {
  const [stats,     setStats]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live platform stats from GET /api/admin/stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAdminStats();
        const s = data.stats;

        // Helper: find a count by grouping field value
        function getCount(rows, key, value) {
          const row = (rows || []).find(r => r[key] === value);
          return parseInt(row?.count || 0, 10);
        }

        setStats({
          homeowners:       getCount(s.users,    'role',   'Homeowner'),
          contractors:      getCount(s.users,    'role',   'Contractor'),
          totalProjects:    (s.projects || []).reduce((n, r) => n + parseInt(r.count, 10), 0),
          openProjects:     getCount(s.projects,  'status', 'Open'),
          totalProposals:   (s.proposals || []).reduce((n, r) => n + parseInt(r.count, 10), 0),
          pendingProposals: getCount(s.proposals, 'status', 'Pending'),
          verifiedContractors: parseInt(s.verifiedContractors || 0, 10),
        });
      } catch (err) {
        console.error('Admin stats fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading || !stats) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div className="dashboard-content">
      <div className="dashboard-greeting">
        <h1 className="dash-title">Admin <span className="dash-name">Control Panel</span> ⚙️</h1>
        <p className="dash-subtitle">Platform overview and management tools.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="🏠" label="Homeowners"          value={stats.homeowners}          accent="orange" />
        <StatCard icon="🔨" label="Contractors"         value={stats.contractors}         accent="green"  />
        <StatCard icon="📁" label="Total Projects"      value={stats.totalProjects}       accent="blue"   />
        <StatCard icon="📋" label="Total Proposals"     value={stats.totalProposals}      accent="purple" />
      </div>

      <div className="quick-actions">
        <h2 className="section-heading">Admin Tools</h2>
        <div className="action-buttons">
          <button className="action-btn action-btn--primary" onClick={() => navigate('admin')}>
            User Management
          </button>
          <button className="action-btn" onClick={() => navigate('browse')}>View All Projects</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { currentUser, isHomeowner, isContractor, isAdmin } = useAuth();
  const { navigate } = useNav();

  return (
    <div className="page-wrapper">
      {isHomeowner  && <HomeownerDashboard  currentUser={currentUser} navigate={navigate} />}
      {isContractor && <ContractorDashboard currentUser={currentUser} navigate={navigate} />}
      {isAdmin      && <AdminDashboard      navigate={navigate} />}
    </div>
  );
}
