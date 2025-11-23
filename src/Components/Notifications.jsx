"use client"

import { useState, useEffect } from "react"
import { FaUserPlus, FaComment, FaHeart, FaEllipsisH, FaTrash, FaEye, FaBell, FaUsers } from "react-icons/fa"
import Navbar from "./Navbar"
import { apiMethods } from "../utils/api"
import { ENDPOINTS } from "../config/apiConfig"
import { toast } from "react-toastify"

function Notifications() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [showMenu, setShowMenu] = useState(null)

    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiMethods.get(ENDPOINTS.NOTIFICATIONS.LIST);
            
            // Handle paginated response or plain array
            const notificationsData = response.data.results || response.data;
            setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Get icon based on notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case "friend_request":
                return <FaUserPlus className="text-blue-500 text-lg" />
            case "friend_accept":
                return <FaUserPlus className="text-green-500 text-lg" />
            case "post_comment":
                return <FaComment className="text-green-500 text-lg" />
            case "comment_like":
            case "post_like":
                return <FaHeart className="text-red-500 text-lg" />
            case "society_invite":
            case "society_join":
                return <FaUsers className="text-purple-500 text-lg" />
            default:
                return <FaBell className="text-gray-500 text-lg" />
        }
    }

    // Handle notification action click
    const handleActionClick = (notificationId, type) => {
        console.log("Notification action clicked:", { notificationId, type })
        // You can add navigation logic here based on notification type
    }

    // Handle menu toggle
    const handleMenuToggle = (notificationId) => {
        setShowMenu(showMenu === notificationId ? null : notificationId)
    }

    // Handle mark as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            await apiMethods.post(ENDPOINTS.NOTIFICATIONS.MARK_READ, {
                notification_ids: [notificationId]
            });
            
            setNotifications(notifications.map((n) => 
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
            setShowMenu(null);
            toast.success("Marked as read");
        } catch (error) {
            console.error('Error marking as read:', error);
            toast.error('Failed to mark as read');
        }
    }

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await apiMethods.post(ENDPOINTS.NOTIFICATIONS.MARK_READ, {});
            
            setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    }

    // Handle notification click
    const handleNotificationClick = (notification) => {
        console.log("Notification clicked:", notification)
        // Navigate to the relevant page based on notification type
        // For example:
        // if (notification.post) navigate(`/feed/${notification.post}`)
        // if (notification.society) navigate(`/society/${notification.society}`)
    }

    return (
        <div className="bg-gray-100 ">

            <div className="my-7">
                <Navbar></Navbar>
            </div>


            {/* Main part...................... */}

            <div className="min-h-[calc(100vh-100px)] pb-6 px-4 sm:px-6 lg:px-8">
                <div className="2xl:px-44 xl:px-36 lg:px-28 md:px-20 sm:px-14 px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
                        {notifications.some(n => !n.is_read) && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        /* Empty State */
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <FaBell className="text-gray-300 text-5xl mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                            <p className="text-gray-500">You're all caught up!</p>
                        </div>
                    ) : (
                        /* Notifications List */
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`bg-gray-50 rounded-lg shadow-sm p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:shadow-md transition-shadow ${!notification.is_read ? "border-l-4 border-blue-500" : ""
                                        }`}
                                >
                                    {/* User Avatar */}
                                    <img
                                        src={notification.sender?.profile_image || "/placeholder.svg"}
                                        alt={notification.sender?.profile_name || "User"}
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0 cursor-pointer"
                                        onClick={() => handleNotificationClick(notification)}
                                    />

                                    {/* Notification Content */}
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                        <p className="text-sm sm:text-base text-gray-900">
                                            <span className="font-semibold">{notification.sender?.profile_name || "Someone"}</span> {notification.message}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            {notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Just now'}
                                        </p>
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                        {/* Type-specific icon */}
                                        <button
                                            onClick={() => handleActionClick(notification.id, notification.notification_type)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            aria-label={`${notification.notification_type} action`}
                                        >
                                            {getNotificationIcon(notification.notification_type)}
                                        </button>

                                        {/* Menu button */}
                                        <div className="relative">
                                            <button
                                                onClick={() => handleMenuToggle(notification.id)}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                aria-label="More options"
                                            >
                                                <FaEllipsisH className="text-gray-500 text-lg" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {showMenu === notification.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                        >
                                                            <FaEye className="text-gray-500" />
                                                            Mark as read
                                                        </button>
                                                    )}
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
    )
}

export default Notifications
