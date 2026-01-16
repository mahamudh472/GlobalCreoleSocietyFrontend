import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../../services/notificationService";
import { queryKeys } from "../../utils/queryKeys";
import { toast } from "react-toastify";

/**
 * Mark a single notification as read
 * Optimistically updates cache
 * @returns {UseMutationResult}
 */
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.list(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.list()
      );

      // Optimistically update
      if (previousNotifications?.results) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          {
            ...previousNotifications,
            results: previousNotifications.results.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            )
          }
        );
      }

      return { previousNotifications };
    },
    onSuccess: () => {
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
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Update all notifications in cache
      queryClient.setQueryData(queryKeys.notifications.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results?.map((n) => ({ ...n, is_read: true })) || []
        };
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
    mutationFn: deleteNotification,
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
      if (previousNotifications?.results) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          {
            ...previousNotifications,
            results: previousNotifications.results.filter((n) => n.id !== notificationId)
          }
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
