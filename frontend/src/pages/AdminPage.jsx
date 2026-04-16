/*
 * AdminPage.jsx
 * -----------------------------------------------
 * Admin user management and platform statistics.
 *
 * Sprint 3 changes:
 *   - Users fetched from GET /api/admin/users (replaces hardcoded list).
 *   - Stats fetched from GET /api/admin/stats (live platform numbers).
 *   - Verify / deactivate actions call PUT /api/admin/verify and
 *     PUT /api/admin/deactivate, then update local state optimistically.
 *   - Loading and error states added throughout.
 */

import { useState, useEffect } from 'react';
import { getAdminUsers, getAdminStats, verifyContractor, deactivateUser } from '../api/admin';
import StatCard      from '../components/StatCard';
import AlertMessage  from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPage.css';

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso));
}

export default function AdminPage() {
  const [users,         setUsers]         = useState([]);
  const [stats,         setStats]         = useState(null);
  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState('All');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab,     setActiveTab]     = useState('users');
  const [isLoading,     setIsLoading]     = useState(true);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');

  // Fetch users and stats on mount
  useEffect(() => {
    async function fetchAdminData() {
      setIsLoading(true);
      try {
        const [usersData, statsData] = await Promise.all([
          getAdminUsers(),
          getAdminStats(),
        ]);
        setUsers(usersData.users || []);
        setStats(statsData.stats);
      } catch (err) {
        setErrorMsg(err.response?.data?.error || 'Failed to load admin data.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  // Apply search + role filter whenever users or filters change
  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'All') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    setFilteredUsers(result);
  }, [users, search, roleFilter]);

  async function handleVerify(userId) {
    try {
      await verifyContractor(userId);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_verified: true } : u));
      setSuccessMsg('Contractor verified successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to verify contractor.');
    }
  }

  async function handleDeactivate(userId) {
    try {
      await deactivateUser(userId);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_verified: false } : u));
      setSuccessMsg('User account deactivated.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to deactivate user.');
    }
  }

  // Helper for parsing stat counts (PostgreSQL COUNT returns strings)
  function getCount(rows, key, value) {
    const row = (rows || []).find(r => r[key] === value);
    return parseInt(row?.count || 0, 10);
  }

  const pendingVerify = users.filter(u => u.role === 'Contractor' && !u.is_verified).length;

  if (isLoading) return <LoadingSpinner message="Loading admin panel…" />;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users and monitor platform activity.</p>
      </div>

      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg   && <AlertMessage type="error"   message={errorMsg}   onClose={() => setErrorMsg('')}   />}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'stats' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Platform Stats
        </button>
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div>
          {pendingVerify > 0 && (
            <AlertMessage
              type="warning"
              message={`${pendingVerify} contractor${pendingVerify > 1 ? 's' : ''} are waiting for verification.`}
            />
          )}

          <div className="admin-filter-bar">
            <input
              type="text"
              className="admin-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="admin-role-tabs">
              {['All', 'Homeowner', 'Contractor', 'Admin'].map(r => (
                <button
                  key={r}
                  className={`role-tab ${roleFilter === r ? 'role-tab--active' : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">No users match your search.</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.user_id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-sm">{user.name[0]}</div>
                          <div>
                            <div className="user-cell-name">{user.name}</div>
                            <div className="user-cell-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
                      </td>
                      <td className="td-muted">{formatDate(user.created_at)}</td>
                      <td>
                        {user.role === 'Contractor' ? (
                          user.is_verified
                            ? <span className="badge badge-open">Verified</span>
                            : <span className="badge badge-pending">Unverified</span>
                        ) : (
                          <span className="badge badge-open">Active</span>
                        )}
                      </td>
                      <td>
                        <div className="action-cell">
                          {user.role === 'Contractor' && !user.is_verified && (
                            <button
                              className="action-verify-btn"
                              onClick={() => handleVerify(user.user_id)}
                            >
                              ✓ Verify
                            </button>
                          )}
                          {user.role !== 'Admin' && user.is_verified && (
                            <button
                              className="action-toggle-btn action-toggle-btn--deactivate"
                              onClick={() => handleDeactivate(user.user_id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && stats && (
        <div className="stats-section">
          <h2 className="stats-section-title">User Statistics</h2>
          <div className="stats-grid-admin">
            <StatCard icon="👥" label="Total Users"     value={users.length}                           accent="orange" />
            <StatCard icon="🏠" label="Homeowners"      value={getCount(stats.users, 'role', 'Homeowner')}  accent="blue"   />
            <StatCard icon="🔨" label="Contractors"     value={getCount(stats.users, 'role', 'Contractor')} accent="green"  />
            <StatCard icon="⏳" label="Awaiting Verify" value={pendingVerify}                          accent="purple" />
          </div>

          <h2 className="stats-section-title" style={{ marginTop: 32 }}>Project Statistics</h2>
          <div className="stats-grid-admin">
            <StatCard
              icon="📁" label="Total Projects"
              value={(stats.projects || []).reduce((n, r) => n + parseInt(r.count, 10), 0)}
              accent="orange"
            />
            <StatCard
              icon="🟢" label="Open Projects"
              value={getCount(stats.projects, 'status', 'Open')}
              accent="green"
            />
            <StatCard
              icon="📋" label="Total Proposals"
              value={(stats.proposals || []).reduce((n, r) => n + parseInt(r.count, 10), 0)}
              accent="blue"
            />
            <StatCard
              icon="⏳" label="Pending Proposals"
              value={getCount(stats.proposals, 'status', 'Pending')}
              accent="purple"
            />
          </div>
        </div>
      )}
    </div>
  );
}
