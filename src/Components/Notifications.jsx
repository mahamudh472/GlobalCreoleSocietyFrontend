"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserPlus,
  FaComment,
  FaHeart,
  FaEllipsisH,
  FaTrash,
  FaEye,
  FaBell,
  FaUsers,
} from "react-icons/fa";
import Navbar from "./Navbar";
import { useNotifications } from "../hooks/queries/useNotifications";
import {
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "../hooks/mutations/useNotifications";
import { DEFAULT_AVATAR } from "../utils/defaultAvatar";

function Notifications() {
  const [showMenu, setShowMenu] = useState(null);
  const navigate = useNavigate();

  // Use TanStack Query for notifications
  const { data: notificationsData, isLoading: loading } = useNotifications();
  const notifications = notificationsData?.results || [];

  // Use mutations
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "friend_request":
        return <FaUserPlus className="text-blue-500 text-lg" />;
      case "friend_accept":
        return <FaUserPlus className="text-green-500 text-lg" />;
      case "post_comment":
        return <FaComment className="text-green-500 text-lg" />;
      case "comment_like":
      case "post_like":
        return <FaHeart className="text-red-500 text-lg" />;
      case "society_invite":
      case "society_join":
        return <FaUsers className="text-purple-500 text-lg" />;
      default:
        return <FaBell className="text-gray-500 text-lg" />;
    }
  };

  // Handle notification action click
  const handleActionClick = (notification, e) => {
    e.stopPropagation();
    // Navigate directly to relevant page
    handleNotificationClick(notification);
  };

  // Handle menu toggle
  const handleMenuToggle = (notificationId, e) => {
    e.stopPropagation();
    setShowMenu(showMenu === notificationId ? null : notificationId);
  };

  // Handle mark as read
  const handleMarkAsRead = (notificationId, e) => {
    if (e) e.stopPropagation();
    markAsReadMutation.mutate(notificationId, {
      onSuccess: () => {
        setShowMenu(null);
      },
    });
  };

  // Handle delete notification
  const handleDelete = (notificationId, e) => {
    if (e) e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId, {
      onSuccess: () => {
        setShowMenu(null);
      },
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Extract post ID - try multiple possible locations
    let postId = null;
    
    // Try direct post field (could be UUID string or object)
    if (notification.post) {
      if (typeof notification.post === 'string') {
        postId = notification.post;
      } else if (typeof notification.post === 'object' && notification.post.id) {
        postId = notification.post.id;
      }
    }
    
    // If still no postId, try to extract from comment object
    if (!postId && notification.comment) {
      if (typeof notification.comment === 'object' && notification.comment.post) {
        postId = typeof notification.comment.post === 'string' 
          ? notification.comment.post 
          : notification.comment.post?.id;
      }
    }
    
    // Navigate to the relevant page based on notification type
    switch (notification.notification_type) {
      case "friend_request":
      case "friend_accept":
        // Navigate to sender's profile
        if (notification.sender?.id) {
          navigate(`/profile/${notification.sender.id}`);
        }
        break;
        
      case "society_invite":
      case "society_join":
        // Navigate to society page
        if (notification.society) {
          navigate(`/society/${notification.society}`);
        }
        break;
        
      case "post_like":
      case "post_comment":
      case "post_share":
        // Navigate to the specific post using 'post' query parameter for notifications
        if (postId) {
          navigate(`/feed?post=${postId}`);
        } else {
          navigate('/feed');
        }
        break;
        
      case "comment_like":
        // Navigate to the post containing the comment
        if (postId) {
          navigate(`/feed?post=${postId}`);
        } else {
          navigate('/feed');
        }
        break;
        
      default:
        // Default: if post exists, go to post; if sender exists, go to their profile; else go to feed
        if (postId) {
          navigate(`/feed?post=${postId}`);
        } else if (notification.sender?.id) {
          navigate(`/profile/${notification.sender.id}`);
        } else {
          navigate('/feed');
        }
    }
  };

  return (
    <div className="bg-gray-100 ">
      <Navbar></Navbar>

      {/* Main part...................... */}

      <div className="min-h-[calc(100vh-100px)] pb-6 px-2 sm:px-4 md:px-6 lg:px-8 pt-7">
        <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-2">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Notifications
            </h1>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
              <FaBell className="text-gray-300 text-4xl sm:text-5xl mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">You're all caught up!</p>
            </div>
          ) : (
            /* Notifications List */
            <div className="space-y-2 sm:space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-gray-50 rounded-lg shadow-sm p-3 sm:p-4 md:p-5 flex items-start gap-2 sm:gap-3 md:gap-4 hover:shadow-md transition-shadow ${
                    !notification.is_read ? "border-l-4 border-blue-500" : ""
                  }`}
                >
                  {/* User Avatar */}
                  <img
                    src={
                      notification.sender?.profile_image || DEFAULT_AVATAR
                    }
                    alt={notification.sender?.profile_name || "User"}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  />

                  {/* Notification Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <p className="text-xs sm:text-sm md:text-base text-gray-900">
                      <span className="font-semibold">
                        {notification.sender?.profile_name || "Someone"}
                      </span>{" "}
                      {notification.message}
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-1">
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleString()
                        : "Just now"}
                    </p>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                    {/* Type-specific icon */}
                    <button
                      onClick={(e) => handleActionClick(notification, e)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label={`${notification.notification_type} action`}
                    >
                      {getNotificationIcon(notification.notification_type)}
                    </button>

                    {/* Menu button */}
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuToggle(notification.id, e)}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="More options"
                      >
                        <FaEllipsisH className="text-gray-500 text-base sm:text-lg" />
                      </button>

                      {/* Dropdown Menu */}
                      {showMenu === notification.id && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FaEye className="text-gray-500" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={handleMarkAllAsRead}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FaEye className="text-gray-500" />
                            Mark all as read
                          </button>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FaTrash className="text-red-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
