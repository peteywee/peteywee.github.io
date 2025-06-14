tsx


// src/components/AuthProvider.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';
import nexusAPI from '../api/nexusAPI'; // Use the configured API client
import { useNavigate } from 'react-router-dom'; // For redirection

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const login = (token: string, username: string) => {
    Cookies.set('access_token', token, {
      expires: 7,
      secure: import.meta.env.PROD,
      sameSite: 'Lax',
    });
    localStorage.setItem('nexus_username', username);
    setIsAuthenticated(true);
    setUser({ username });
    navigate('/ingest');
  };

  const logout = () => {
    Cookies.remove('access_token');
    localStorage.removeItem('nexus_username');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  const verifyAuth = async () => {
    const token = Cookies.get('access_token');
    const storedUsername = localStorage.getItem('nexus_username');

    if (!token || !storedUsername) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await nexusAPI.get('/auth/me');
      setIsAuthenticated(true);
      setUser({ username: response.data.username });
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyAuth();

    const handleAuthError = () => {
      console.warn('Authentication error detected, logging out.');
      logout();
    };

    window.addEventListener('authError', handleAuthError);

    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
