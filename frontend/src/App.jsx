/*
 * App.jsx
 * -----------------------------------------------
 * Root application component.
 *
 * Sprint 2 Navigation: Uses useState-based page switching
 * instead of React Router (React Router is introduced in
 * Sprint 3 — API Integration & Routing workshop).
 *
 * Demonstrates:
 *  - Context Provider composition
 *  - Conditional rendering as navigation
 *  - Protected route pattern using state
 *  - Lifting state (navigation) to top level
 */

import { useAuth }            from './context/AuthContext';
import { AuthProvider }       from './context/AuthContext';
import { NavProvider, DataProvider, useNav } from './context/AppContext';
import Navbar                 from './components/Navbar';
import LoadingSpinner         from './components/LoadingSpinner';

// Pages
import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import DashboardPage       from './pages/DashboardPage';
import BrowseProjectsPage  from './pages/BrowseProjectsPage';
import CreateProjectPage   from './pages/CreateProjectPage';
import ProjectDetailPage   from './pages/ProjectDetailPage';
import MyProjectsPage      from './pages/MyProjectsPage';
import MyProposalsPage     from './pages/MyProposalsPage';
import AdminPage           from './pages/AdminPage';

import './App.css';

// ── Router — page switcher using conditional rendering ────────────────────────

function AppRouter() {
  const { currentUser, isLoading, isHomeowner, isContractor, isAdmin } = useAuth();
  const { currentPage, navigate } = useNav();

  // Show spinner while auth state is being restored from localStorage
  if (isLoading) {
    return <LoadingSpinner message="Starting Buildora…" />;
  }

  // ── Public pages (no auth required) ──
  if (!currentUser) {
    if (currentPage === 'register') return <RegisterPage />;
    if (currentPage === 'login')    return <LoginPage />;
    // For any other page, unauthenticated users see the home page
    return <HomePage />;
  }

  // ── Protected pages (auth required) ──
  // Route guard: redirect to dashboard for routes that don't match the user's role
  function renderPage() {
    switch (currentPage) {
      case 'home':
      case 'dashboard':
        return <DashboardPage />;

      case 'browse':
        return <BrowseProjectsPage />;

      case 'project-detail':
        return <ProjectDetailPage />;

      // Homeowner-only pages
      case 'create-project':
        if (!isHomeowner) { navigate('dashboard'); return <DashboardPage />; }
        return <CreateProjectPage />;

      case 'my-projects':
        if (!isHomeowner) { navigate('dashboard'); return <DashboardPage />; }
        return <MyProjectsPage />;

      // Contractor-only pages
      case 'my-proposals':
        if (!isContractor) { navigate('dashboard'); return <DashboardPage />; }
        return <MyProposalsPage />;

      // Admin-only pages
      case 'admin':
        if (!isAdmin) { navigate('dashboard'); return <DashboardPage />; }
        return <AdminPage />;

      // Redirect unknown pages to dashboard
      default:
        return <DashboardPage />;
    }
  }

  return renderPage();
}

// ── Main App — Provider composition ──────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <NavProvider>
        <DataProvider>
          <div className="app">
            <Navbar />
            <main className="app-main">
              <AppRouter />
            </main>
            <footer className="app-footer">
              <div className="container">
                <span>© 2025 Buildora — Home Renovation Marketplace</span>
                <span className="footer-divider">·</span>
                <span>Built with React 18 + Vite</span>
                <span className="footer-divider">·</span>
                <span>Sprint 2: Frontend (PROG2500)</span>
              </div>
            </footer>
          </div>
        </DataProvider>
      </NavProvider>
    </AuthProvider>
  );
}
