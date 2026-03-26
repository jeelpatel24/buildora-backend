/*
 * AdminPage.jsx
 * -----------------------------------------------
 * Admin user management and platform statistics.
 * Demonstrates: useEffect for stats calculation, useState for
 * user list management, searching, and local state mutations.
 */

import { useState, useEffect } from 'react';
import { useData }             from '../context/AppContext';
import StatCard                from '../components/StatCard';
import AlertMessage            from '../components/AlertMessage';
import './AdminPage.css';

// Seeded user list for admin view (Sprint 2: local state only)
const INITIAL_USERS = [
  { user_id: 1, name: 'Alex Homeowner',  email: 'homeowner@demo.com', role: 'Homeowner',  is_verified: true,  created_at: '2025-02-15T09:00:00Z', is_active: true },
  { user_id: 2, name: 'Sam Contractor',  email: 'contractor@demo.com', role: 'Contractor', is_verified: true,  created_at: '2025-02-18T11:00:00Z', is_active: true },
  { user_id: 3, name: 'Admin User',      email: 'admin@buildora.com',  role: 'Admin',      is_verified: true,  created_at: '2025-01-01T00:00:00Z', is_active: true },
  { user_id: 4, name: 'Jordan Builder',  email: 'jordan@build.ca',     role: 'Contractor', is_verified: false, created_at: '2025-03-10T14:00:00Z', is_active: true },
  { user_id: 5, name: 'Pat Renovations', email: 'pat@reno.ca',         role: 'Contractor', is_verified: false, created_at: '2025-03-12T10:00:00Z', is_active: true },
  { user_id: 6, name: 'Morgan Smith',    email: 'morgan@home.ca',      role: 'Homeowner',  is_verified: true,  created_at: '2025-03-05T08:00:00Z', is_active: true },
  { user_id: 7, name: 'Casey Builds',    email: 'casey@contractor.ca', role: 'Contractor', is_verified: true,  created_at: '2025-02-28T09:00:00Z', is_active: false },
];

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso));
}

export default function AdminPage() {
  const { projects, proposals } = useData();

  const [users,        setUsers]        = useState(INITIAL_USERS);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('All');
  const [filteredUsers, setFilteredUsers] = useState(INITIAL_USERS);
  const [stats,        setStats]        = useState({});
  const [successMsg,   setSuccessMsg]   = useState('');
  const [activeTab,    setActiveTab]    = useState('users'); // 'users' | 'stats'

  // Compute platform stats
  useEffect(() => {
    setStats({
      totalUsers:       users.length,
      homeowners:       users.filter((u) => u.role === 'Homeowner').length,
      contractors:      users.filter((u) => u.role === 'Contractor').length,
      pendingVerify:    users.filter((u) => u.role === 'Contractor' && !u.is_verified && u.is_active).length,
      totalProjects:    projects.length,
      openProjects:     projects.filter((p) => p.status === 'Open').length,
      totalProposals:   proposals.length,
      pendingProposals: proposals.filter((p) => p.status === 'Pending').length,
    });
  }, [users, projects, proposals]);

  // Apply search + role filter
  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'All') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    setFilteredUsers(result);
  }, [users, search, roleFilter]);

  function handleVerify(userId) {
    setUsers((prev) =>
      prev.map((u) => u.user_id === userId ? { ...u, is_verified: true } : u)
    );
    setSuccessMsg('Contractor verified successfully!');
  }

  function handleToggleActive(userId) {
    setUsers((prev) =>
      prev.map((u) => u.user_id === userId ? { ...u, is_active: !u.is_active } : u)
    );
    const user = users.find((u) => u.user_id === userId);
    setSuccessMsg(user.is_active ? 'User account deactivated.' : 'User account reactivated.');
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users and monitor platform activity.</p>
      </div>

      {successMsg && (
        <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
      )}

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
          {/* Pending verification alert */}
          {stats.pendingVerify > 0 && (
            <AlertMessage
              type="warning"
              message={`${stats.pendingVerify} contractor${stats.pendingVerify > 1 ? 's' : ''} are waiting for verification.`}
            />
          )}

          {/* Filter bar */}
          <div className="admin-filter-bar">
            <input
              type="text"
              className="admin-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin-role-tabs">
              {['All', 'Homeowner', 'Contractor', 'Admin'].map((r) => (
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

          {/* Users table */}
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
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className={!user.is_active ? 'user-row--inactive' : ''}>
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
                        {!user.is_active ? (
                          <span className="badge badge-closed">Deactivated</span>
                        ) : user.role === 'Contractor' ? (
                          user.is_verified
                            ? <span className="badge badge-open">Verified</span>
                            : <span className="badge badge-pending">Unverified</span>
                        ) : (
                          <span className="badge badge-open">Active</span>
                        )}
                      </td>
                      <td>
                        <div className="action-cell">
                          {user.role === 'Contractor' && !user.is_verified && user.is_active && (
                            <button
                              className="action-verify-btn"
                              onClick={() => handleVerify(user.user_id)}
                            >
                              ✓ Verify
                            </button>
                          )}
                          {user.role !== 'Admin' && (
                            <button
                              className={`action-toggle-btn ${user.is_active ? 'action-toggle-btn--deactivate' : 'action-toggle-btn--activate'}`}
                              onClick={() => handleToggleActive(user.user_id)}
                            >
                              {user.is_active ? 'Deactivate' : 'Reactivate'}
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
      {activeTab === 'stats' && (
        <div className="stats-section">
          <h2 className="stats-section-title">User Statistics</h2>
          <div className="stats-grid-admin">
            <StatCard icon="👥" label="Total Users"        value={stats.totalUsers}    accent="orange" />
            <StatCard icon="🏠" label="Homeowners"         value={stats.homeowners}    accent="blue"   />
            <StatCard icon="🔨" label="Contractors"        value={stats.contractors}   accent="green"  />
            <StatCard icon="⏳" label="Awaiting Verify"    value={stats.pendingVerify} accent="purple" />
          </div>

          <h2 className="stats-section-title" style={{ marginTop: 32 }}>Project Statistics</h2>
          <div className="stats-grid-admin">
            <StatCard icon="📁" label="Total Projects"     value={stats.totalProjects}    accent="orange" />
            <StatCard icon="🟢" label="Open Projects"      value={stats.openProjects}     accent="green"  />
            <StatCard icon="📋" label="Total Proposals"    value={stats.totalProposals}   accent="blue"   />
            <StatCard icon="⏳" label="Pending Proposals"  value={stats.pendingProposals} accent="purple" />
          </div>
        </div>
      )}
    </div>
  );
}
