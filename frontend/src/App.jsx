/*
 * App.jsx
 * -----------------------------------------------
 * Root application component.
 *
 * Sprint 3 changes vs Sprint 2:
 *   - Uses React Router <Routes> / <Route> for real URL-based navigation.
 *   - ProtectedRoute enforces auth + optional role checks (redirects to
 *     /login or /dashboard when access is denied).
 *   - PublicRoute redirects already-logged-in users to /dashboard so
 *     they don't land on the login/register forms unnecessarily.
 *
 * Context nesting order matters:
 *   AuthProvider must wrap NavProvider because NavProvider (and DataProvider)
 *   call useAuth() internally to read the current user's role.
 *   NavProvider must be inside BrowserRouter (see main.jsx) because it uses
 *   React Router's useNavigate() and useLocation() hooks.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }   from './context/AuthContext';
import { NavProvider, DataProvider } from './context/AppContext';
import Navbar          from './components/Navbar';
import LoadingSpinner  from './components/LoadingSpinner';

// Pages
import HomePage           from './pages/HomePage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import DashboardPage      from './pages/DashboardPage';
import BrowseProjectsPage from './pages/BrowseProjectsPage';
import CreateProjectPage  from './pages/CreateProjectPage';
import ProjectDetailPage  from './pages/ProjectDetailPage';
import MyProjectsPage     from './pages/MyProjectsPage';
import MyProposalsPage    from './pages/MyProposalsPage';
import AdminPage          from './pages/AdminPage';
import NotFoundPage       from './pages/NotFoundPage';

import './App.css';

// ── Route guards ──────────────────────────────────────────────────────────────

// Redirect unauthenticated users to /login.
// Optional roles array restricts access to specific roles (→ /dashboard).
function ProtectedRoute({ children, roles }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner message="Starting Buildora…" />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Redirect already-authenticated users away from login/register.
function PublicRoute({ children }) {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner message="Starting Buildora…" />;
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Route table ───────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/"          element={<PublicRoute><HomePage /></PublicRoute>} />
      <Route path="/login"     element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"  element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected pages — any authenticated role */}
      <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/browse"     element={<ProtectedRoute><BrowseProjectsPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />

      {/* Homeowner-only pages */}
      <Route
        path="/create-project"
        element={<ProtectedRoute roles={['Homeowner']}><CreateProjectPage /></ProtectedRoute>}
      />
      <Route
        path="/my-projects"
        element={<ProtectedRoute roles={['Homeowner']}><MyProjectsPage /></ProtectedRoute>}
      />

      {/* Contractor-only pages */}
      <Route
        path="/my-proposals"
        element={<ProtectedRoute roles={['Contractor']}><MyProposalsPage /></ProtectedRoute>}
      />

      {/* Admin-only pages */}
      <Route
        path="/admin"
        element={<ProtectedRoute roles={['Admin']}><AdminPage /></ProtectedRoute>}
      />

      {/* Catch-all: show a proper 404 page for unknown URLs */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
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
              <AppRoutes />
            </main>
            <footer className="app-footer">
              <div className="container">
                <span>© 2025 Buildora — Home Renovation Marketplace</span>
                <span className="footer-divider">·</span>
                <span>Built with React 18 + Vite + Express + PostgreSQL</span>
                <span className="footer-divider">·</span>
                <span>Sprint 3: Integration (PROG2500)</span>
              </div>
            </footer>
          </div>
        </DataProvider>
      </NavProvider>
    </AuthProvider>
  );
}
