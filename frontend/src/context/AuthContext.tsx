import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import Cookies from 'js-cookie';

interface User {
  _id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  emailReports: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

interface AuthError {
  message: string;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  login: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { data } = await api.get<User>('/auth/profile');
      setUser(data);
    } catch (err) {
      const authError: AuthError = {
        message: 'Failed to authenticate',
        code: err instanceof Error ? err.name : 'UNKNOWN_ERROR'
      };
      setError(authError);
      // Clean up any invalid tokens
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/github`;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      const authError: AuthError = {
        message: 'Failed to logout',
        code: err instanceof Error ? err.name : 'LOGOUT_ERROR'
      };
      setError(authError);
      // Clean up cookies even if the API call fails
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      setUser(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, clearError }}>
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
