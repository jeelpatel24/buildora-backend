/*
 * AppContext.jsx
 * -----------------------------------------------
 * Provides navigation state and shared project/proposal data.
 *
 * Sprint 3 changes vs Sprint 2:
 *   - NavProvider now uses React Router's useNavigate / useLocation
 *     instead of plain useState. This gives real URL-based routing
 *     while keeping the same navigate('page', params) API that all
 *     existing page components rely on — zero changes needed there.
 *   - DataProvider fetches from the real Express API instead of
 *     returning hardcoded seed data. Each mutation (add, update,
 *     delete) calls the API first and then refreshes local state.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import * as projectsApi  from '../api/projects';
import * as proposalsApi from '../api/proposals';

// ─── Navigation Context ───────────────────────────────────────────────────────

const NavContext = createContext(null);

// Maps our internal page names to URL paths (keeps page components unchanged)
const PAGE_TO_PATH = {
  'home':           '/',
  'dashboard':      '/dashboard',
  'browse':         '/browse',
  'create-project': '/create-project',
  'my-projects':    '/my-projects',
  'my-proposals':   '/my-proposals',
  'admin':          '/admin',
  'login':          '/login',
  'register':       '/register',
};

export function NavProvider({ children }) {
  const rrNavigate = useNavigate();
  const location   = useLocation();

  function navigate(page, params = {}) {
    if (page === 'project-detail' && params.projectId) {
      rrNavigate(`/projects/${params.projectId}`);
    } else {
      rrNavigate(PAGE_TO_PATH[page] || '/dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Derive the current "page name" from the URL so Navbar active states work
  const path = location.pathname;
  let currentPage = 'home';
  if      (path === '/dashboard')       currentPage = 'dashboard';
  else if (path === '/browse')          currentPage = 'browse';
  else if (path === '/create-project')  currentPage = 'create-project';
  else if (path === '/my-projects')     currentPage = 'my-projects';
  else if (path === '/my-proposals')    currentPage = 'my-proposals';
  else if (path === '/admin')           currentPage = 'admin';
  else if (path === '/login')           currentPage = 'login';
  else if (path === '/register')        currentPage = 'register';
  else if (path.startsWith('/projects/')) currentPage = 'project-detail';

  // Pass project ID through pageParams so ProjectDetailPage can use it
  const projectId = path.startsWith('/projects/')
    ? parseInt(path.split('/')[2], 10)
    : null;
  const pageParams = projectId ? { projectId } : {};

  return (
    <NavContext.Provider value={{ currentPage, pageParams, navigate }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>');
  return ctx;
}

// ─── Data Context ─────────────────────────────────────────────────────────────
// Fetches and caches project / proposal data from the API.
// Provides mutation functions that call the API and update local state.

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();

  // Global open-project list (used by BrowseProjectsPage + admin/contractor dashboards)
  const [projects,    setProjects]    = useState([]);
  // Homeowner's own projects — all statuses, includes proposal_count
  const [myProjects,  setMyProjects]  = useState([]);
  // Contractor's own proposals — includes project_title from the JOIN
  const [proposals,   setProposals]   = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [dataError,   setDataError]   = useState(null);

  // ── Initial data load ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setDataError(null);

    try {
      if (currentUser.role === 'Homeowner') {
        // Fetch open projects (for browse) AND own projects (for dashboard + my-projects)
        const [browsRes, mineRes] = await Promise.all([
          projectsApi.getProjects(),
          projectsApi.getMyProjects(),
        ]);
        setProjects(browsRes.projects  || []);
        setMyProjects(mineRes.projects || []);

      } else if (currentUser.role === 'Contractor') {
        // Fetch open projects (for browse + dashboard) AND own proposals
        const [browsRes, proposRes] = await Promise.all([
          projectsApi.getProjects(),
          proposalsApi.getMyProposals(),
        ]);
        setProjects(browsRes.projects   || []);
        setProposals(proposRes.proposals || []);

      } else {
        // Admin — just the open project list for stats
        const browsRes = await projectsApi.getProjects();
        setProjects(browsRes.projects || []);
      }
    } catch (err) {
      setDataError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.user_id, currentUser?.role]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      // User logged out — clear everything
      setProjects([]);
      setMyProjects([]);
      setProposals([]);
    }
  }, [currentUser?.user_id]);

  // ── Project mutations ──────────────────────────────────────────────────────

  async function addProject(projectData) {
    const data = await projectsApi.createProject(projectData);
    const newProject = data.project;
    // Add to both lists (it starts as Open, so it appears in browse too)
    newProject.proposal_count = 0;
    setMyProjects(prev => [newProject, ...prev]);
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }

  async function updateProject(updatedProject) {
    const { project_id, title, description, budget_min, budget_max, location } = updatedProject;
    const data = await projectsApi.updateProject(project_id, {
      title, description, budget_min, budget_max, location,
    });
    const saved = data.project;
    setMyProjects(prev => prev.map(p => p.project_id === project_id ? saved : p));
    setProjects(prev => prev.map(p => p.project_id === project_id ? saved : p));
    return saved;
  }

  async function deleteProject(id) {
    await projectsApi.deleteProject(id);
    setMyProjects(prev => prev.filter(p => p.project_id !== id));
    setProjects(prev => prev.filter(p => p.project_id !== id));
  }

  // ── Proposal mutations ─────────────────────────────────────────────────────

  async function addProposal(proposalData) {
    const data = await proposalsApi.submitProposal({
      project_id:     proposalData.project_id,
      proposed_price: proposalData.proposed_price,
      message:        proposalData.message,
    });
    const newProposal = data.proposal;
    setProposals(prev => [newProposal, ...prev]);
    return newProposal;
  }

  async function acceptProposal(proposalId, projectId) {
    await proposalsApi.acceptProposal(proposalId);
    // Optimistically update local state — the API handles the DB atomically
    setProposals(prev => prev.map(p => {
      if (p.project_id === projectId) {
        return p.proposal_id === proposalId
          ? { ...p, status: 'Accepted' }
          : { ...p, status: 'Rejected' };
      }
      return p;
    }));
    setProjects(prev =>
      prev.map(p => p.project_id === projectId ? { ...p, status: 'Accepted' } : p)
    );
    setMyProjects(prev =>
      prev.map(p => p.project_id === projectId ? { ...p, status: 'Accepted' } : p)
    );
  }

  async function deleteProposal(id) {
    await proposalsApi.withdrawProposal(id);
    setProposals(prev => prev.filter(p => p.proposal_id !== id));
  }

  const value = {
    projects,
    myProjects,
    proposals,
    isLoading,
    dataError,
    addProject,
    updateProject,
    deleteProject,
    addProposal,
    acceptProposal,
    deleteProposal,
    refreshData: fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
