import { useQuery } from '@tanstack/react-query'
import { apiMethods } from '../../utils/api'
import { ENDPOINTS } from '../../config/apiConfig'
import { queryKeys } from '../../utils/queryKeys'

/**
 * Fetch all notifications for the current user
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useNotifications = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.NOTIFICATIONS.LIST)
      const notificationsData = response.data.results || response.data
      return Array.isArray(notificationsData) ? notificationsData : []
    },
    staleTime: 1000 * 30, // 30 seconds - notifications should be fresh
    refetchInterval: 1000 * 60, // Refetch every minute
    ...options,
  })
}

/**
 * Fetch unread notification count
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useUnreadNotificationCount = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)
      return response.data.count || response.data.unread_count || 0
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    ...options,
  })
}
