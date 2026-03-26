/*
 * AuthContext.jsx
 * -----------------------------------------------
 * Provides global authentication state via React Context API.
 * Demonstrates: createContext, useContext, useState, useEffect,
 * Context Provider pattern, and custom hook.
 * -----------------------------------------------
 * NOTE (Sprint 2): Auth state is managed locally using localStorage.
 * Actual API calls will be wired in Sprint 3 (API Integration).
 */

import { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the context object
const AuthContext = createContext(null);

// Seeded demo users so the app works offline for Sprint 2
const DEMO_USERS = [
  {
    user_id: 1,
    name: 'Alex Homeowner',
    email: 'homeowner@demo.com',
    password: 'demo123',
    role: 'Homeowner',
    is_verified: true,
  },
  {
    user_id: 2,
    name: 'Sam Contractor',
    email: 'contractor@demo.com',
    password: 'demo123',
    role: 'Contractor',
    is_verified: true,
  },
  {
    user_id: 3,
    name: 'Admin User',
    email: 'admin@buildora.com',
    password: 'admin123',
    role: 'Admin',
    is_verified: true,
  },
];

// 2. Provider component that wraps the app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Rehydrate session from localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem('buildora_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('buildora_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login: validates against demo users, persists to localStorage
  function login(email, password) {
    const found = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) {
      throw new Error('Invalid email or password.');
    }
    // Never store the password in state
    const { password: _pw, ...safeUser } = found;
    setCurrentUser(safeUser);
    localStorage.setItem('buildora_user', JSON.stringify(safeUser));
    return safeUser;
  }

  // Register: adds a new user to the demo list and auto-logs in
  function register(name, email, password, role) {
    const exists = DEMO_USERS.find((u) => u.email === email);
    if (exists) {
      throw new Error('An account with that email already exists.');
    }
    const newUser = {
      user_id: DEMO_USERS.length + 1,
      name,
      email,
      password,
      role,
      is_verified: role !== 'Contractor', // contractors start unverified
    };
    DEMO_USERS.push(newUser);
    const { password: _pw, ...safeUser } = newUser;
    setCurrentUser(safeUser);
    localStorage.setItem('buildora_user', JSON.stringify(safeUser));
    return safeUser;
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('buildora_user');
  }

  // Utility role helpers
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

// 3. Custom hook so consumers don't need to import useContext directly
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
