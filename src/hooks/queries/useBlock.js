import { useQuery } from "@tanstack/react-query";
import queryKeys from "../../utils/queryKeys";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";

/**
 * Fetch all notifications for the current user
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useBlockedUsersQuery = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.users.blockedUsers(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.USERS.BLOCKED_USERS);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Fetch unread notification count
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
