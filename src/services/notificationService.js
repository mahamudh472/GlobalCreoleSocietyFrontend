import api from '../utils/api';
import { ENDPOINTS } from '../config/apiConfig';

/**
 * Notification Service - Handles all notification-related API calls
 */

/**
 * Get list of notifications
 * @returns {Promise} API response with notifications list
 */
export const getNotifications = async () => {
  try {
    const response = await api.get(ENDPOINTS.NOTIFICATIONS.LIST);
    
    // Check if response is paginated (has 'results' property)
    if (response.data && response.data.results) {
      return response.data;
    }
    
    // If it's a plain array, return it wrapped in results
    if (Array.isArray(response.data)) {
      return { results: response.data, count: response.data.length };
    }
    
    // Fallback to empty results
    return { results: [], count: 0 };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * This calculates count from the notifications list since backend doesn't have a specific count endpoint
 * @returns {Promise} Count of unread notifications
 */
export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get(ENDPOINTS.NOTIFICATIONS.LIST);
    
    let notifications = [];
    if (response.data && response.data.results) {
      notifications = response.data.results;
    } else if (Array.isArray(response.data)) {
      notifications = response.data;
    }
    
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return unreadCount;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification ID to mark as read
 * @returns {Promise} API response
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.post(
      ENDPOINTS.NOTIFICATIONS.SINGLE_NOTIFICATION(notificationId)
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise} API response
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.post(ENDPOINTS.NOTIFICATIONS.MARK_READ);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID to delete
 * @returns {Promise} API response
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(
      ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
