/*
 * BrowseProjectsPage.jsx
 * -----------------------------------------------
 * Lists all open projects with live search and filter.
 *
 * Sprint 3 changes:
 *   - Projects now come from DataContext, which fetches from the real API.
 *   - Added a loading state and error display for the initial data fetch.
 *   - Logic for filtering/sorting is unchanged (demonstrates array methods).
 */

import { useState, useEffect }    from 'react';
import { useData, useNav }        from '../context/AppContext';
import { useAuth }                from '../context/AuthContext';
import ProjectCard                from '../components/ProjectCard';
import LoadingSpinner             from '../components/LoadingSpinner';
import AlertMessage               from '../components/AlertMessage';
import './BrowseProjectsPage.css';

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest First' },
  { value: 'oldest',      label: 'Oldest First' },
  { value: 'budget-asc',  label: 'Budget: Low to High' },
  { value: 'budget-desc', label: 'Budget: High to Low' },
];

const STATUS_FILTERS = ['All', 'Open', 'Accepted', 'Closed'];

export default function BrowseProjectsPage() {
  const { projects, isLoading, dataError } = useData();
  const { navigate }                       = useNav();
  const { isContractor, currentUser }      = useAuth();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy,       setSortBy]       = useState('newest');
  const [filteredList, setFilteredList] = useState([]);

  // Recalculate filtered list whenever projects or filters change
  useEffect(() => {
    let result = [...projects];

    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':      return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':      return new Date(a.created_at) - new Date(b.created_at);
        case 'budget-asc':  return a.budget_min - b.budget_min;
        case 'budget-desc': return b.budget_max - a.budget_max;
        default:            return 0;
      }
    });

    setFilteredList(result);
  }, [projects, search, statusFilter, sortBy]);

  function handleViewProject(project) {
    navigate('project-detail', { projectId: project.project_id });
  }

  function handleReset() {
    setSearch('');
    setStatusFilter('All');
    setSortBy('newest');
  }

  const hasFilters = search || statusFilter !== 'All' || sortBy !== 'newest';

  if (isLoading) return <LoadingSpinner message="Loading projects…" />;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Browse Projects</h1>
        <p className="page-subtitle">
          {filteredList.length} project{filteredList.length !== 1 ? 's' : ''} found
          {search && ` for "${search}"`}
        </p>
      </div>

      {dataError && (
        <AlertMessage type="error" message={dataError} />
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <span className="filter-search-icon">🔍</span>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by title, description, or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="filter-clear-btn" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="filter-tabs">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? 'filter-tab--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          className="filter-sort"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button className="filter-reset-btn" onClick={handleReset}>Reset filters</button>
        )}
      </div>

      {isContractor && currentUser?.is_verified && (
        <div className="contractor-tip">
          💡 Click <strong>View Details</strong> on any open project to submit a proposal.
        </div>
      )}

      {filteredList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <h3>No projects found</h3>
          <p>Try adjusting your filters or search term.</p>
          {hasFilters && (
            <button
              className="action-btn action-btn--primary"
              style={{ marginTop: 16 }}
              onClick={handleReset}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid-cards">
          {filteredList.map(project => (
            <ProjectCard
              key={project.project_id}
              project={project}
              viewMode="browse"
              onView={handleViewProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
