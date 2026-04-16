/*
 * api/client.js
 * -----------------------------------------------
 * Centralized Axios instance for all API calls.
 *
 * Sprint 3: API Integration
 * - Reads VITE_API_URL from .env (empty in production = same origin)
 * - Attaches the JWT token to every request automatically
 * - Handles 401 (expired token) by clearing storage and redirecting to login
 */

import axios from 'axios';

// In development the Vite proxy forwards /api/* to localhost:3000.
// In production the backend serves the frontend on the same origin,
// so an empty base URL means all requests go to the same host.
const BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Reads the JWT from localStorage and attaches it as a Bearer token so every
// protected route receives it without needing to pass it manually each time.

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('buildora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
// If the server returns 401 (token expired or missing), clear localStorage
// and redirect to the login page so the user can re-authenticate.

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buildora_token');
      localStorage.removeItem('buildora_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
