import { useQuery } from '@tanstack/react-query';
import { authHelpers, apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';

/**
 * Current User Query Hook
 * 
 * Fetches and caches the current authenticated user's data
 * This replaces the user state from AuthContext
 * 
 * @returns {object} query object with data (user), isLoading, error, etc.
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: () => {
      // First check localStorage for initial data
      const user = authHelpers.getCurrentUser();
      const isAuth = authHelpers.isAuthenticated();
      
      if (!isAuth) {
        return null;
      }
      
      // Return cached user data immediately
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    // Only enable query if user is authenticated
    enabled: authHelpers.isAuthenticated(),
  });
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
