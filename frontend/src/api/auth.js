/*
 * api/auth.js
 * -----------------------------------------------
 * API functions for authentication.
 * Sprint 3: replaces the demo-user logic in AuthContext.
 */

import apiClient from './client';

// POST /api/auth/login — returns { token, user, message }
export async function loginUser(email, password) {
  const res = await apiClient.post('/api/auth/login', { email, password });
  return res.data;
}

// POST /api/auth/register — returns { token, user, message }
export async function registerUser(name, email, password, role) {
  const res = await apiClient.post('/api/auth/register', { name, email, password, role });
  return res.data;
}
