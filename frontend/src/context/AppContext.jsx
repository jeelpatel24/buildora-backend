/*
 * AppContext.jsx
 * -----------------------------------------------
 * Provides global navigation state and project/proposal data.
 * Uses useState-based navigation instead of React Router
 * (React Router is introduced in Sprint 3 - API Integration & Routing).
 * -----------------------------------------------
 * Demonstrates: Context API, useState, useReducer pattern,
 * derived state, and lifting state up.
 */

import { createContext, useContext, useState, useReducer } from 'react';

// ─── Navigation Context ───────────────────────────────────────────────────────

const NavContext = createContext(null);

export function NavProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams,  setPageParams]  = useState({});

  function navigate(page, params = {}) {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

// ─── Data Context (Projects & Proposals — local state for Sprint 2) ──────────

const DataContext = createContext(null);

// Seed data — realistic renovation projects
const SEED_PROJECTS = [
  {
    project_id: 1,
    homeowner_id: 1,
    homeowner_name: 'Alex Homeowner',
    title: 'Kitchen Complete Renovation',
    description:
      'Full kitchen gut and remodel — new cabinets, countertops, appliances, and flooring. Looking for experienced general contractors with verifiable kitchen renovation portfolio.',
    budget_min: 18000,
    budget_max: 28000,
    location: 'Toronto, ON',
    status: 'Open',
    created_at: '2025-03-10T09:00:00Z',
    proposal_count: 2,
  },
  {
    project_id: 2,
    homeowner_id: 1,
    homeowner_name: 'Alex Homeowner',
    title: 'Basement Waterproofing & Finishing',
    description:
      'Interior waterproofing system installation followed by full basement finishing — framing, drywall, electrical rough-in, and luxury vinyl plank flooring.',
    budget_min: 25000,
    budget_max: 40000,
    location: 'Mississauga, ON',
    status: 'Open',
    created_at: '2025-03-12T14:30:00Z',
    proposal_count: 1,
  },
  {
    project_id: 3,
    homeowner_id: 1,
    homeowner_name: 'Alex Homeowner',
    title: 'Master Bathroom Spa Conversion',
    description:
      'Convert standard master bath into spa-style retreat. Double vanity, freestanding tub, walk-in shower with steam, heated floors.',
    budget_min: 15000,
    budget_max: 22000,
    location: 'Brampton, ON',
    status: 'Accepted',
    created_at: '2025-03-01T11:00:00Z',
    proposal_count: 3,
  },
  {
    project_id: 4,
    homeowner_id: 1,
    homeowner_name: 'Alex Homeowner',
    title: 'Exterior Deck & Pergola Build',
    description:
      "New 400 sq ft composite deck with integrated pergola, privacy screen, and built-in seating. Must comply with the city's building permit requirements.",
    budget_min: 12000,
    budget_max: 18000,
    location: 'Oakville, ON',
    status: 'Open',
    created_at: '2025-03-15T08:00:00Z',
    proposal_count: 0,
  },
  {
    project_id: 5,
    homeowner_id: 1,
    homeowner_name: 'Alex Homeowner',
    title: 'HVAC System Full Replacement',
    description:
      'Replace aging oil furnace and central AC with high-efficiency heat pump system. Include ductwork inspection and any necessary sealing or replacement.',
    budget_min: 8000,
    budget_max: 14000,
    location: 'Burlington, ON',
    status: 'Open',
    created_at: '2025-03-18T10:00:00Z',
    proposal_count: 1,
  },
];

const SEED_PROPOSALS = [
  {
    proposal_id: 1,
    project_id: 1,
    contractor_id: 2,
    contractor_name: 'Sam Contractor',
    proposed_price: 23500,
    message:
      'We specialize in full kitchen renovations. Our team is fully licensed and insured with 12+ years of experience. We can start within 2 weeks.',
    status: 'Pending',
    created_at: '2025-03-11T10:00:00Z',
  },
  {
    proposal_id: 2,
    project_id: 1,
    contractor_id: 2,
    contractor_name: 'Sam Contractor',
    proposed_price: 21000,
    message:
      'Competitive bid — we source materials wholesale and pass savings to clients. WSIB certificate available on request.',
    status: 'Pending',
    created_at: '2025-03-12T09:00:00Z',
  },
  {
    proposal_id: 3,
    project_id: 3,
    contractor_id: 2,
    contractor_name: 'Sam Contractor',
    proposed_price: 19800,
    message:
      'We completed 4 spa bathroom conversions in 2024. Reference photos and client testimonials available.',
    status: 'Accepted',
    created_at: '2025-03-05T14:00:00Z',
  },
];

// Simple reducer for project mutations
function projectsReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state];
    case 'UPDATE':
      return state.map((p) =>
        p.project_id === action.payload.project_id ? action.payload : p
      );
    case 'DELETE':
      return state.filter((p) => p.project_id !== action.id);
    case 'INCREMENT_PROPOSALS':
      return state.map((p) =>
        p.project_id === action.projectId
          ? { ...p, proposal_count: (p.proposal_count || 0) + 1 }
          : p
      );
    default:
      return state;
  }
}

function proposalsReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state];
    case 'ACCEPT':
      return state.map((p) => {
        if (p.project_id === action.projectId) {
          return p.proposal_id === action.proposalId
            ? { ...p, status: 'Accepted' }
            : { ...p, status: 'Rejected' };
        }
        return p;
      });
    case 'DELETE':
      return state.filter((p) => p.proposal_id !== action.id);
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [projects,  dispatchProjects]  = useReducer(projectsReducer,  SEED_PROJECTS);
  const [proposals, dispatchProposals] = useReducer(proposalsReducer, SEED_PROPOSALS);
  const [nextProjectId,  setNextProjectId]  = useState(SEED_PROJECTS.length + 1);
  const [nextProposalId, setNextProposalId] = useState(SEED_PROPOSALS.length + 1);

  function addProject(projectData) {
    const newProject = {
      ...projectData,
      project_id:    nextProjectId,
      status:        'Open',
      proposal_count: 0,
      created_at:    new Date().toISOString(),
    };
    dispatchProjects({ type: 'ADD', payload: newProject });
    setNextProjectId((n) => n + 1);
    return newProject;
  }

  function updateProject(updated) {
    dispatchProjects({ type: 'UPDATE', payload: updated });
  }

  function deleteProject(id) {
    dispatchProjects({ type: 'DELETE', id });
  }

  function addProposal(proposalData) {
    const newProposal = {
      ...proposalData,
      proposal_id: nextProposalId,
      status:      'Pending',
      created_at:  new Date().toISOString(),
    };
    dispatchProposals({ type: 'ADD', payload: newProposal });
    dispatchProjects({ type: 'INCREMENT_PROPOSALS', projectId: proposalData.project_id });
    setNextProposalId((n) => n + 1);
    return newProposal;
  }

  function acceptProposal(proposalId, projectId) {
    dispatchProposals({ type: 'ACCEPT', proposalId, projectId });
    dispatchProjects({
      type: 'UPDATE',
      payload: {
        ...projects.find((p) => p.project_id === projectId),
        status: 'Accepted',
      },
    });
  }

  function deleteProposal(id) {
    dispatchProposals({ type: 'DELETE', id });
  }

  const value = {
    projects,
    proposals,
    addProject,
    updateProject,
    deleteProject,
    addProposal,
    acceptProposal,
    deleteProposal,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
