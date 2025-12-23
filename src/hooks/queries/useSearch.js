import { useQuery } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';

/**
 * User Search Query Hook
 * 
 * Searches for users by name, email, or username.
 * 
 * @param {string} query - The search query string
 * @param {object} options - Additional query options
 * @returns {object} query object with search results
 */
export const useUserSearch = (query, options = {}) => {
  return useQuery({
    queryKey: queryKeys.search.users(query),
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { results: [], count: 0 };
      }
      
      const response = await apiMethods.get(
        `${ENDPOINTS.AUTH.SEARCH_USERS}?q=${encodeURIComponent(query.trim())}&limit=10`
      );
      return response.data;
    },
    enabled: !!query && query.trim().length >= 2 && options.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export default useUserSearch;
