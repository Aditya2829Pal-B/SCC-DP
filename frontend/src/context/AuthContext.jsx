import React, { createContext, useContext, useState, useEffect } from 'react';
import dataService from '../services/dataService';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages authentication state with JWT
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('scc_token');
    const storedUser = localStorage.getItem('scc_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('scc_token');
        localStorage.removeItem('scc_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await dataService.login(email, password);
    const { token, user: userData } = res;

    localStorage.setItem('scc_token', token);
    localStorage.setItem('scc_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const signup = async (name, email, password, location) => {
    const res = await dataService.signup(name, email, password, location);
    const { token, user: userData } = res;

    localStorage.setItem('scc_token', token);
    localStorage.setItem('scc_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('scc_token');
    localStorage.removeItem('scc_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = { user, loading, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
