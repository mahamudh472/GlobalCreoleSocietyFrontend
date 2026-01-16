import { useQuery } from '@tanstack/react-query'
import { getNotifications, getUnreadNotificationCount } from '../../services/notificationService'
import { queryKeys } from '../../utils/queryKeys'

/**
 * Fetch all notifications for the current user
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useNotifications = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: getNotifications,
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
    queryFn: getUnreadNotificationCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    ...options,
  })
}
