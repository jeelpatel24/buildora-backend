/*
 * Navbar.jsx
 * -----------------------------------------------
 * Top navigation bar component.
 * Demonstrates: functional components, props, conditional rendering,
 * event handlers, and consuming multiple contexts.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNav }  from '../context/AppContext';
import './Navbar.css';

// RolePill — sub-component showing the user's role badge
function RolePill({ role }) {
  const roleClass = {
    Homeowner:  'badge-homeowner',
    Contractor: 'badge-contractor',
    Admin:      'badge-admin',
  }[role] || '';

  return <span className={`badge ${roleClass}`}>{role}</span>;
}

// NavLink — reusable nav item that highlights when active
function NavLink({ page, label, currentPage, navigate }) {
  return (
    <button
      className={`nav-link ${currentPage === page ? 'nav-link--active' : ''}`}
      onClick={() => navigate(page)}
    >
      {label}
    </button>
  );
}

export default function Navbar() {
  const { currentUser, isHomeowner, isContractor, isAdmin, logout } = useAuth();
  const { currentPage, navigate } = useNav();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('home');
    setMenuOpen(false);
  }

  // Build nav links based on role
  function buildLinks() {
    if (!currentUser) return [];
    const common = [{ page: 'browse', label: 'Browse Projects' }];

    if (isHomeowner) {
      return [
        ...common,
        { page: 'my-projects',  label: 'My Projects' },
        { page: 'create-project', label: '+ New Project' },
      ];
    }
    if (isContractor) {
      return [
        ...common,
        { page: 'my-proposals', label: 'My Proposals' },
      ];
    }
    if (isAdmin) {
      return [
        ...common,
        { page: 'admin', label: 'Admin Panel' },
      ];
    }
    return common;
  }

  const links = buildLinks();

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <button className="navbar-logo" onClick={() => navigate('home')}>
          <span className="logo-icon">⬡</span>
          <span className="logo-text">Buildora</span>
        </button>

        {/* Desktop nav links */}
        {currentUser && (
          <nav className="navbar-links desktop-only">
            {links.map((l) => (
              <NavLink
                key={l.page}
                page={l.page}
                label={l.label}
                currentPage={currentPage}
                navigate={navigate}
              />
            ))}
          </nav>
        )}

        {/* Right side: user info or auth buttons */}
        <div className="navbar-right desktop-only">
          {currentUser ? (
            <div className="user-menu">
              <button
                className="user-menu-trigger"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="user-avatar">{currentUser.name[0]}</span>
                <span className="user-name">{currentUser.name}</span>
                <RolePill role={currentUser.role} />
                <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={() => { navigate('dashboard'); setMenuOpen(false); }}
                  >
                    Dashboard
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="btn-ghost" onClick={() => navigate('login')}>Sign In</button>
              <button className="btn-primary" onClick={() => navigate('register')}>Get Started</button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="hamburger mobile-only"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-drawer mobile-only">
          {currentUser ? (
            <>
              <div className="mobile-user-info">
                <span className="user-avatar">{currentUser.name[0]}</span>
                <div>
                  <div className="user-name">{currentUser.name}</div>
                  <RolePill role={currentUser.role} />
                </div>
              </div>
              <div className="mobile-links">
                {links.map((l) => (
                  <button
                    key={l.page}
                    className="mobile-link"
                    onClick={() => { navigate(l.page); setMenuOpen(false); }}
                  >
                    {l.label}
                  </button>
                ))}
                <button
                  className="mobile-link"
                  onClick={() => { navigate('dashboard'); setMenuOpen(false); }}
                >
                  Dashboard
                </button>
              </div>
              <button className="mobile-signout" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <div className="mobile-auth">
              <button className="btn-ghost" onClick={() => { navigate('login');    setMenuOpen(false); }}>Sign In</button>
              <button className="btn-primary" onClick={() => { navigate('register'); setMenuOpen(false); }}>Get Started</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
