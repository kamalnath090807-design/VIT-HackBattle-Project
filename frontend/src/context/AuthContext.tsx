/**
 * AURA Frontend — Auth Context
 *
 * Provides authentication state, JWT persistence, and demo quick-login support.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('aura_auth_token');
    const savedUser = localStorage.getItem('aura_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        api.setToken(savedToken);
      } catch (err) {
        localStorage.removeItem('aura_auth_token');
        localStorage.removeItem('aura_auth_user');
      }
    } else {
      // Out-of-the-box demo session with valid UUID
      const defaultUser = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'judge@vithackbattle.org' };
      const defaultToken = 'aura-demo-jwt-token-hackbattle-2026';
      setToken(defaultToken);
      setUser(defaultUser);
      api.setToken(defaultToken);
      localStorage.setItem('aura_auth_token', defaultToken);
      localStorage.setItem('aura_auth_user', JSON.stringify(defaultUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setToken(res.token);
    api.setToken(res.token);
    localStorage.setItem('aura_auth_user', JSON.stringify(res.user));
  };

  const register = async (email: string, password: string) => {
    await api.register(email, password);
    // Automatically log in after registration
    await login(email, password);
  };

  /**
   * Demo quick-login mode for hackathon review.
   * Generates a signed-looking demo JWT for testing dashboard flows.
   */
  const demoLogin = () => {
    const demoUser = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'judge@vithackbattle.org' };
    const demoToken = 'aura-demo-jwt-token-hackbattle-2026';
    setUser(demoUser);
    setToken(demoToken);
    api.setToken(demoToken);
    localStorage.setItem('aura_auth_token', demoToken);
    localStorage.setItem('aura_auth_user', JSON.stringify(demoUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.setToken(null);
    localStorage.removeItem('aura_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
