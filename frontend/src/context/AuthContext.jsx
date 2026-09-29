import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('vidora_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state by verifying with backend
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.getCurrentUser();
        if (response?.data) {
          setUser(response.data);
          localStorage.setItem('vidora_user', JSON.stringify(response.data));
        }
      } catch (err) {
        // If unauthenticated or token expired, clear stale local state
        setUser(null);
        localStorage.removeItem('vidora_user');
        localStorage.removeItem('vidora_access_token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      const res = await authApi.login(credentials);
      const data = res.data;

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('vidora_user', JSON.stringify(data.user));
      }
      if (data?.accessToken) {
        localStorage.setItem('vidora_access_token', data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem('vidora_refresh_token', data.refreshToken);
      }

      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const res = await authApi.register(formData);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout backend warning:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('vidora_user');
      localStorage.removeItem('vidora_access_token');
      localStorage.removeItem('vidora_refresh_token');
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedUser };
      localStorage.setItem('vidora_user', JSON.stringify(next));
      return next;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('vidora_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
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
