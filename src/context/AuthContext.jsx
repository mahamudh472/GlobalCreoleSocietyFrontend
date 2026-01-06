import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authHelpers } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';

const AuthContext = createContext(null);

/**
 * Helper to get initial auth state SYNCHRONOUSLY from localStorage
 * This prevents the flash of unauthenticated UI on page load
 */
const getInitialAuthState = () => {
  const token = localStorage.getItem('access_token');
  const savedUser = authHelpers.getCurrentUser();
  
  if (token && savedUser) {
    return {
      user: savedUser,
      isAuthenticated: true,
      loading: false, // Already loaded from localStorage
    };
  }
  
  return {
    user: null,
    isAuthenticated: false,
    loading: false, // No need to load, we know user is not authenticated
  };
};

export const AuthProvider = ({ children }) => {
  // CRITICAL: Initialize state SYNCHRONOUSLY from localStorage
  // This prevents flash of "Sign In" button when user is already logged in
  const initialState = getInitialAuthState();
  
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [loading, setLoading] = useState(initialState.loading);
  
  // Get query client for cache management
  // Note: We need to handle the case where QueryClient isn't available yet
  let queryClient = null;
  try {
    queryClient = useQueryClient();
  } catch (e) {
    // QueryClient not available in this context
  }

  // Listen for authentication failures (expired tokens that can't be refreshed)
  useEffect(() => {
    const handleAuthFailed = () => {
      console.log('Auth failed - logging out user');
      setUser(null);
      setIsAuthenticated(false);
      // Clear React Query cache
      if (queryClient) {
        queryClient.resetQueries();
        queryClient.removeQueries();
      }
    };

    const handleTokenRefreshed = () => {
      console.log('Token refreshed successfully');
      // Token was refreshed, ensure user is still marked as authenticated
      const currentUser = authHelpers.getCurrentUser();
      if (currentUser && !isAuthenticated) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    window.addEventListener('token-refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('auth-failed', handleAuthFailed);
      window.removeEventListener('token-refreshed', handleTokenRefreshed);
    };
  }, [isAuthenticated, queryClient]);

  const login = useCallback(async (email, password) => {
    try {
      // CRITICAL: Clear ALL cached queries BEFORE login to prevent stale data
      if (queryClient) {
        queryClient.resetQueries();
        queryClient.removeQueries();
      }
      
      const data = await authHelpers.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Update React Query cache with new user
      if (queryClient) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
        // Invalidate all user-specific queries to force refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.detail || 'Login failed' 
      };
    }
  }, [queryClient]);

  const register = useCallback(async (userData) => {
    try {
      // Clear any existing cached data before registration
      if (queryClient) {
        queryClient.resetQueries();
      }
      
      const data = await authHelpers.register(userData);
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Update React Query cache with new user
      if (queryClient) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authHelpers.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      
      // CRITICAL: Clear ALL React Query cache on logout
      if (queryClient) {
        queryClient.resetQueries();
        queryClient.removeQueries();
      }
    }
  }, [queryClient]);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Sync with React Query cache
    if (queryClient) {
      queryClient.setQueryData(queryKeys.auth.currentUser(), userData);
    }
  }, [queryClient]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
