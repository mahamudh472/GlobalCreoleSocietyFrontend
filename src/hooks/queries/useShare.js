import { useQuery } from '@tanstack/react-query'
import { apiMethods } from '../../utils/api'
import { ENDPOINTS } from '../../config/apiConfig'
import { queryKeys } from '../../utils/queryKeys'

/**
 * Fetch all notifications for the current user
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */

export const useShareLinkQuery = (conversationId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.chat.shareLink(conversationId),   
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.CHAT.SHARE_LINK(conversationId))
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
/**
 * Fetch unread notification count
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */

