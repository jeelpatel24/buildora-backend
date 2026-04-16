/*
 * api/projects.js
 * -----------------------------------------------
 * API functions for the projects resource.
 * Sprint 3: replaces the local useReducer data in DataProvider.
 */

import apiClient from './client';

// GET /api/projects — all open projects (with homeowner name + proposal count)
export async function getProjects() {
  const res = await apiClient.get('/api/projects');
  return res.data; // { projects, count }
}

// GET /api/projects/my — homeowner's own projects (all statuses + proposal_count)
export async function getMyProjects() {
  const res = await apiClient.get('/api/projects/my');
  return res.data; // { projects, count }
}

// GET /api/projects/:id — single project with homeowner details
export async function getProjectById(id) {
  const res = await apiClient.get(`/api/projects/${id}`);
  return res.data; // { project }
}

// POST /api/projects — create a new project (Homeowner only)
export async function createProject(data) {
  const res = await apiClient.post('/api/projects', data);
  return res.data; // { project, message }
}

// PUT /api/projects/:id — update an existing project (owner only)
export async function updateProject(id, data) {
  const res = await apiClient.put(`/api/projects/${id}`, data);
  return res.data; // { project, message }
}

// DELETE /api/projects/:id — remove a project (owner only, no accepted proposals)
export async function deleteProject(id) {
  const res = await apiClient.delete(`/api/projects/${id}`);
  return res.data; // { message }
}
