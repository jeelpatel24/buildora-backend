/*
 * MyProjectsPage.jsx
 * -----------------------------------------------
 * Homeowner's personal project list with edit and delete.
 *
 * Sprint 3 changes:
 *   - Reads from DataContext.myProjects (fetched from /api/projects/my)
 *     instead of filtering the global projects list client-side.
 *   - updateProject() and deleteProject() in DataContext now call the API.
 *   - Loading/error states added for async mutations.
 */

import { useState, useEffect } from 'react';
import { useData, useNav }     from '../context/AppContext';
import ProjectCard             from '../components/ProjectCard';
import AlertMessage            from '../components/AlertMessage';
import './MyProjectsPage.css';

// Inline edit modal
function EditModal({ project, onSave, onClose, isSaving }) {
  const [formData, setFormData] = useState({
    title:      project.title,
    description: project.description,
    location:   project.location,
    budget_min: String(project.budget_min),
    budget_max: String(project.budget_max),
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const e = {};
    if (!formData.title.trim())       e.title       = 'Title is required.';
    if (!formData.description.trim()) e.description = 'Description is required.';
    if (!formData.location.trim())    e.location    = 'Location is required.';
    const min = parseFloat(formData.budget_min);
    const max = parseFloat(formData.budget_max);
    if (isNaN(min) || min <= 0) e.budget_min = 'Enter a valid minimum.';
    if (isNaN(max) || max <= 0) e.budget_max = 'Enter a valid maximum.';
    else if (!isNaN(min) && max <= min) e.budget_max = 'Max must exceed min.';
    return e;
  }

  function handleSave(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      ...project,
      ...formData,
      budget_min: parseFloat(formData.budget_min),
      budget_max: parseFloat(formData.budget_max),
    });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Edit Project</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSave} noValidate className="modal-form">
          {[
            { name: 'title',      label: 'Title',          type: 'text',   placeholder: 'Project title' },
            { name: 'location',   label: 'Location',       type: 'text',   placeholder: 'City, Province' },
            { name: 'budget_min', label: 'Min Budget ($)', type: 'number', placeholder: '0' },
            { name: 'budget_max', label: 'Max Budget ($)', type: 'number', placeholder: '0' },
          ].map(field => (
            <div key={field.name} className={`form-group ${errors[field.name] ? 'form-group--error' : ''}`}>
              <label className="form-label">{field.label}</label>
              <input
                name={field.name} type={field.type}
                className="form-input" placeholder={field.placeholder}
                value={formData[field.name]} onChange={handleChange}
                disabled={isSaving}
              />
              {errors[field.name] && <span className="form-error">{errors[field.name]}</span>}
            </div>
          ))}
          <div className={`form-group ${errors.description ? 'form-group--error' : ''}`}>
            <label className="form-label">Description</label>
            <textarea
              name="description" className="form-input" rows="4"
              value={formData.description} onChange={handleChange} disabled={isSaving}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="modal-btn-save" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MyProjectsPage() {
  const { myProjects, updateProject, deleteProject, isLoading } = useData();
  const { navigate } = useNav();

  const [editProject,     setEditProject]     = useState(null);
  const [successMsg,      setSuccessMsg]      = useState('');
  const [errorMsg,        setErrorMsg]        = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isMutating,      setIsMutating]      = useState(false);

  async function handleSaveEdit(updated) {
    setIsMutating(true);
    setErrorMsg('');
    try {
      await updateProject(updated);
      setEditProject(null);
      setSuccessMsg('Project updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update project. Please try again.');
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteExecute() {
    setIsMutating(true);
    setErrorMsg('');
    try {
      await deleteProject(confirmDeleteId);
      setConfirmDeleteId(null);
      setSuccessMsg('Project deleted.');
    } catch (err) {
      setConfirmDeleteId(null);
      setErrorMsg(err.response?.data?.error || 'Failed to delete project.');
    } finally {
      setIsMutating(false);
    }
  }

  function handleViewProject(project) {
    navigate('project-detail', { projectId: project.project_id });
  }

  const openCount     = myProjects.filter(p => p.status === 'Open').length;
  const acceptedCount = myProjects.filter(p => p.status === 'Accepted').length;

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">
            {myProjects.length} project{myProjects.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
            {openCount} open &nbsp;·&nbsp; {acceptedCount} accepted
          </p>
        </div>
        <button className="create-btn" onClick={() => navigate('create-project')}>
          + Post New Project
        </button>
      </div>

      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg   && <AlertMessage type="error"   message={errorMsg}   onClose={() => setErrorMsg('')}   />}

      {isLoading ? (
        <div className="empty-state"><p>Loading your projects…</p></div>
      ) : myProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No projects yet</h3>
          <p>Post your first renovation project to start receiving proposals.</p>
          <button className="create-btn" style={{ marginTop: 16 }} onClick={() => navigate('create-project')}>
            + Post Your First Project
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {myProjects.map(project => (
            <ProjectCard
              key={project.project_id}
              project={project}
              viewMode="my-projects"
              onView={handleViewProject}
              onEdit={p => setEditProject(p)}
              onDelete={p => setConfirmDeleteId(p.project_id)}
            />
          ))}
        </div>
      )}

      {editProject && (
        <EditModal
          project={editProject}
          onSave={handleSaveEdit}
          onClose={() => setEditProject(null)}
          isSaving={isMutating}
        />
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => !isMutating && setConfirmDeleteId(null)}>
          <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Project?</h2>
            </div>
            <p className="delete-warning">
              This action cannot be undone. The project and all associated data will be removed.
            </p>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setConfirmDeleteId(null)} disabled={isMutating}>
                Keep Project
              </button>
              <button className="modal-btn-delete" onClick={handleDeleteExecute} disabled={isMutating}>
                {isMutating ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
