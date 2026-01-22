import { useQuery } from "@tanstack/react-query";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import { queryKeys } from "../../utils/queryKeys";

/**
 * Fetch user's friends list
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useFriends = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.FRIENDS.LIST);
      // Return full response data to preserve count for paginated responses
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Fetch user's friends list with server-side pagination
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @param {string|number} userId - Optional user ID to fetch friends for (if not provided, fetches current user's friends)
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useFriendsPaginated = (page = 1, limit = 10, userId = null, options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.friends.list(), { page, limit, userId }],
    queryFn: async () => {
      const userParam = userId ? `&user=${userId}` : '';
      const response = await apiMethods.get(
        `${ENDPOINTS.FRIENDS.LIST}?page=${page}&page_size=${limit}${userParam}`,
      );
      // Expect standard paginated response: { count, next, previous, results }
      const data = response.data;
      if (Array.isArray(data)) {
        // Non-paginated fallback
        return { count: data.length, results: data };
      }
      // Ensure shape includes results
      return {
        count: data.count ?? (data.results ? data.results.length : 0),
        next: data.next ?? null,
        previous: data.previous ?? null,
        results: data.results ?? [],
      };
    },
    keepPreviousData: true,
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
};

/**
 * Fetch pending friend requests (received)
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useFriendRequests = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.friends.requests(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.FRIENDS.REQUESTS);
      return response.data.results || response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent for requests)
    ...options,
  });
};

/**
 * Fetch friend suggestions
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useFriendSuggestions = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.friends.suggestions(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.FRIENDS.SUGGESTIONS);
      return response.data.results || response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (changes less frequently)
    ...options,
  });
};

/**
 * Fetch friends for a specific user
 * @param {string|number} userId - User ID
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useUserFriendsQuery = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.friends.list(userId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.ACCOUNTS.FRIENDS(userId));
      // Return full response data to preserve count for paginated responses
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Search friends by name or username
 * @param {string} searchQuery - Search query
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useSearchFriends = (searchQuery, options = {}) => {
  return useQuery({
    queryKey: queryKeys.friends.search(searchQuery),
    queryFn: async () => {
      const response = await apiMethods.get(
        `${ENDPOINTS.FRIENDS.LIST}?search=${encodeURIComponent(searchQuery)}`,
      );
      return response.data.results || response.data;
    },
    enabled: !!searchQuery && searchQuery.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
    ...options,
  });
};
