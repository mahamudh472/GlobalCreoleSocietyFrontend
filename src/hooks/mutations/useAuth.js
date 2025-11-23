import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authHelpers } from '../../utils/api';
import { queryKeys, removeQueriesByPrefix } from '../../utils/queryKeys';
import { toast } from 'react-toastify';

/**
 * Login Mutation Hook
 * 
 * Handles user login and caches user data in React Query
 * 
 * @returns {object} mutation object with mutate, isLoading, error, etc.
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }) => authHelpers.login(email, password),
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      
      // Invalidate and refetch any user-specific data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      
      toast.success('Login successful!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Login failed';
      toast.error(errorMessage);
      console.error('Login error:', error);
    },
  });
};

/**
 * Register Mutation Hook
 * 
 * Handles user registration and automatically logs in
 * 
 * @returns {object} mutation object
 */
export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => authHelpers.register(userData),
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      
      // Invalidate and refetch any user-specific data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      
      toast.success('Registration successful!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error ||
                          'Registration failed';
      toast.error(errorMessage);
      console.error('Register error:', error);
    },
  });
};

/**
 * Logout Mutation Hook
 * 
 * Handles user logout and clears all cached data
 * 
 * @returns {object} mutation object
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authHelpers.logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      
      // Or selectively remove auth-related queries
      removeQueriesByPrefix(queryClient, queryKeys.auth.all);
      
      toast.success('Logged out successfully');
    },
    onError: (error) => {
      // Even on error, clear local data
      queryClient.clear();
      console.error('Logout error:', error);
    },
  });
};

/**
 * Update User Profile Mutation Hook
 * 
 * Handles user profile updates with optimistic updates
 * 
 * @returns {object} mutation object
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => {
      // You'll need to implement this in your api.js
      // For now, it's a placeholder
      return authHelpers.updateProfile?.(userData);
    },
    onMutate: async (newUserData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.currentUser() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(queryKeys.auth.currentUser());

      // Optimistically update to the new value
      if (previousUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), {
          ...previousUser,
          ...newUserData,
        });
      }

      // Return context with the previous value
      return { previousUser };
    },
    onError: (error, newUserData, context) => {
      // Rollback to the previous value on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), context.previousUser);
      }
      toast.error('Failed to update profile');
      console.error('Update user error:', error);
    },
    onSuccess: (data) => {
      // Update the cache with the response data
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user || data);
      
      // Also update localStorage for persistence
      localStorage.setItem('user', JSON.stringify(data.user || data));
      
      toast.success('Profile updated successfully!');
    },
    onSettled: () => {
      // Invalidate to ensure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    },
  });
};
