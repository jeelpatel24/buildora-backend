/*
 * api/proposals.js
 * -----------------------------------------------
 * API functions for the proposals resource.
 * Sprint 3: wires the proposal actions to the real Express backend.
 */

import apiClient from './client';

// POST /api/proposals — contractor submits a bid
export async function submitProposal(data) {
  const res = await apiClient.post('/api/proposals', data);
  return res.data; // { proposal, message }
}

// GET /api/proposals/project/:id — proposals for a project (homeowner only)
export async function getProjectProposals(projectId) {
  const res = await apiClient.get(`/api/proposals/project/${projectId}`);
  return res.data; // { proposals, count }
}

// GET /api/proposals/my — contractor's own proposals with project info joined
export async function getMyProposals() {
  const res = await apiClient.get('/api/proposals/my');
  return res.data; // { proposals, count }
}

// PUT /api/proposals/:id/accept — homeowner accepts a proposal (atomic)
export async function acceptProposal(proposalId) {
  const res = await apiClient.put(`/api/proposals/${proposalId}/accept`);
  return res.data; // { message, proposalId }
}

// DELETE /api/proposals/:id — contractor withdraws a pending proposal
export async function withdrawProposal(proposalId) {
  const res = await apiClient.delete(`/api/proposals/${proposalId}`);
  return res.data; // { message }
}
