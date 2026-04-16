/*
 * api/admin.js
 * -----------------------------------------------
 * API functions for admin-only endpoints.
 * Sprint 3: replaces the hardcoded INITIAL_USERS list in AdminPage.
 */

import apiClient from './client';

// GET /api/admin/users — all registered users (Admin only)
export async function getAdminUsers() {
  const res = await apiClient.get('/api/admin/users');
  return res.data; // { users, count }
}

// GET /api/admin/stats — platform statistics (Admin only)
export async function getAdminStats() {
  const res = await apiClient.get('/api/admin/stats');
  return res.data; // { stats }
}

// PUT /api/admin/verify/:userId — grant verified status to a Contractor
export async function verifyContractor(userId) {
  const res = await apiClient.put(`/api/admin/verify/${userId}`);
  return res.data; // { message }
}

// PUT /api/admin/deactivate/:userId — soft-deactivate a user account
export async function deactivateUser(userId) {
  const res = await apiClient.put(`/api/admin/deactivate/${userId}`);
  return res.data; // { message }
}
