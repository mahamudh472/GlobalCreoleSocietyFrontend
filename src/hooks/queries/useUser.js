import { useQuery } from '@tanstack/react-query';
import { authHelpers, apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';
import { useAuth } from '../../context/AuthContext';

/**
 * Current User Query Hook
 * 
 * Returns the current authenticated user's data from AuthContext.
 * This ensures components using this hook stay in sync with auth state changes.
 * 
 * IMPORTANT: This now wraps AuthContext to provide a consistent interface
 * while maintaining synchronization with login/logout state.
 * 
 * @returns {object} query-like object with data (user), isLoading, etc.
 */
export const useCurrentUser = () => {
  // Get user directly from AuthContext - this is the source of truth
  const { user, loading, isAuthenticated } = useAuth();
  
  // Return a query-like object for backward compatibility
  return {
    data: user,
    isLoading: loading,
    isError: false,
    error: null,
    isSuccess: !loading && isAuthenticated,
    isFetching: loading,
    refetch: () => Promise.resolve({ data: user }), // No-op for backward compat
  };
};

/**
 * Check if user is authenticated
 * Simple hook that returns authentication status
 * 
 * @returns {boolean} true if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { data: user } = useCurrentUser();
  return !!user && authHelpers.isAuthenticated();
};

/**
 * User Profile Query Hook
 * 
 * Fetches detailed user profile by user ID
 * Different from useCurrentUser - this can fetch any user's profile
 * 
 * @param {string|number} userId - The ID of the user to fetch
 * @param {object} options - Additional query options
 * @returns {object} query object with user profile data
 */
export const useUserProfile = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.profile.details(userId),
    queryFn: async () => {
      const response = await apiMethods.get(`${ENDPOINTS.ACCOUNTS.PROFILE}${userId}/`);
      return response.data;
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

/**
 * User Posts Query Hook
 * 
 * Fetches posts for a specific user
 * 
 * @param {string|number} userId - The ID of the user
 * @param {object} options - Additional query options
 * @returns {object} query object with user's posts
 */
export const useUserPosts = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.profile.posts(userId),
    queryFn: async () => {
      const response = await apiMethods.get(`${ENDPOINTS.POSTS.LIST}?user=${userId}`);
      return response.data.results || response.data;
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * User Friends Query Hook
 * 
 * Fetches friends list for a specific user
 * 
 * @param {string|number} userId - The ID of the user
 * @param {object} options - Additional query options
 * @returns {object} query object with user's friends
 */
export const useUserFriends = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.profile.friends(userId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.ACCOUNTS.FRIENDS(userId));
      return response.data.results || response.data;
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Current User Full Profile Query Hook
 * 
 * Fetches the full current user profile from API including extra emails/phones
 * Use this when you need fresh data from the server
 * 
 * @param {object} options - Additional query options
 * @returns {object} query object with user profile data
 */
export const useCurrentUserProfile = (options = {}) => {
  return useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.ACCOUNTS.PROFILE);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};
