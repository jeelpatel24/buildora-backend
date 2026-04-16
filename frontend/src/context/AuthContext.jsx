/*
 * AuthContext.jsx
 * -----------------------------------------------
 * Provides global authentication state via React Context API.
 *
 * Sprint 3 changes vs Sprint 2:
 *   - login() and register() now make real API calls (async).
 *   - JWT token is stored in localStorage alongside the user object.
 *   - The token is picked up automatically by the Axios interceptor
 *     in api/client.js — no manual header passing needed.
 *   - User data is normalized on the way in so the rest of the app
 *     can keep using currentUser.user_id and currentUser.is_verified.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth';

// 1. Create the context object
const AuthContext = createContext(null);

// ── Normalize the user shape returned by the API ──────────────────────────────
// The auth endpoints return camelCase keys (userId, isVerified) but the rest of
// the app was built with snake_case (user_id, is_verified). Normalizing here
// means none of the page components need to change.

function normalizeUser(apiUser) {
  return {
    user_id:     apiUser.userId,
    name:        apiUser.name,
    email:       apiUser.email,
    role:        apiUser.role,
    is_verified: apiUser.isVerified,
  };
}

// 2. Provider component that wraps the whole app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Rehydrate session from localStorage on first render so a page refresh
  // doesn't force the user to log in again.
  useEffect(() => {
    const stored = localStorage.getItem('buildora_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        // Corrupted storage — wipe it and force re-login
        localStorage.removeItem('buildora_user');
        localStorage.removeItem('buildora_token');
      }
    }
    setIsLoading(false);
  }, []);

  // login: calls POST /api/auth/login, stores token + user, updates state
  async function login(email, password) {
    const data = await loginUser(email, password);
    const user = normalizeUser(data.user);
    localStorage.setItem('buildora_token', data.token);
    localStorage.setItem('buildora_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }

  // register: calls POST /api/auth/register, auto-logs in on success
  async function register(name, email, password, role) {
    const data = await registerUser(name, email, password, role);
    const user = normalizeUser(data.user);
    localStorage.setItem('buildora_token', data.token);
    localStorage.setItem('buildora_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('buildora_user');
    localStorage.removeItem('buildora_token');
  }

  // Utility role helpers — consumed by Navbar and protected routes
  const isHomeowner  = currentUser?.role === 'Homeowner';
  const isContractor = currentUser?.role === 'Contractor';
  const isAdmin      = currentUser?.role === 'Admin';

  const value = {
    currentUser,
    isLoading,
    isHomeowner,
    isContractor,
    isAdmin,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Custom hook — consumers don't need to import useContext directly
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
