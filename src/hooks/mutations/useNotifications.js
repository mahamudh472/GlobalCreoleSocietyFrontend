import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import { queryKeys } from "../../utils/queryKeys";
import { toast } from "react-toastify";

/**
 * Mark notification(s) as read
 * Optimistically updates cache
 * @returns {UseMutationResult}
 */
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds) => {
      // notificationIds can be a single ID or array of IDs
      const ids = Array.isArray(notificationIds)
        ? notificationIds
        : [notificationIds];

      const response = await apiMethods.post(
        ENDPOINTS.NOTIFICATIONS.MARK_READ,
        {
          notification_ids: ids,
        }
      );
      return { ids, data: response.data };
    },
    onMutate: async (notificationIds) => {
      const ids = Array.isArray(notificationIds)
        ? notificationIds
        : [notificationIds];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.list(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.list()
      );

      // Optimistically update
      if (previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          previousNotifications.map((n) =>
            ids.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
      }

      return { previousNotifications };
    },
    onSuccess: () => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.count(),
      });
      toast.success("Marked as read");
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          context.previousNotifications
        );
      }

      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    },
  });
};

/**
 * Mark all notifications as read
 * @returns {UseMutationResult}
 */
export const useMarkAllAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiMethods.post(
        ENDPOINTS.NOTIFICATIONS.MARK_READ,
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      // Update all notifications in cache
      queryClient.setQueryData(queryKeys.notifications.list(), (old) => {
        if (!old) return old;
        return old.map((n) => ({ ...n, is_read: true }));
      });

      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.count(),
      });
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    },
  });
};

/**
 * Delete a notification
 * Optimistically removes from cache
 * @returns {UseMutationResult}
 */
export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await apiMethods.delete(
        ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
      );
      // return notificationId
      return { data: response.data, notificationId };
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.list(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.list()
      );

      // Optimistically remove notification
      if (previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          previousNotifications.filter((n) => n.id !== notificationId)
        );
      }

      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.count(),
      });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          context.previousNotifications
        );
      }

      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    },
  });
};
