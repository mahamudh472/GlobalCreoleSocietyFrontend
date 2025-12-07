// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.10.13.99/api';

// API Endpoints
export const ENDPOINTS = {
  // Authentication & Accounts
  AUTH: {
    LOGIN: '/accounts/login/',
    REGISTER: '/accounts/register/',
    LOGOUT: '/accounts/logout/',
    REFRESH_TOKEN: '/accounts/token/refresh/',
    PROFILE: '/accounts/profile/',
    OTHER_USER_PROFILE: (userId) => `/accounts/profile/${userId}/`,
    CHANGE_PASSWORD: '/accounts/change-password/',
    CHANGE_EMAIL: '/accounts/change-email/',
    SEND_OTP: '/accounts/send-otp/',
  },

  // Accounts (alias for AUTH for consistency)
  ACCOUNTS: {
    LOGIN: '/accounts/login/',
    REGISTER: '/accounts/register/',
    LOGOUT: '/accounts/logout/',
    REFRESH_TOKEN: '/accounts/token/refresh/',
    PROFILE: '/accounts/profile/',
    OTHER_USER_PROFILE: (userId) => `/accounts/profile/${userId}/`,
    FRIENDS: (userId) => `/social/friends/?user=${userId}`,
    CHANGE_PASSWORD: '/accounts/change-password/',
    CHANGE_EMAIL: '/accounts/change-email/',
    SEND_OTP: '/accounts/send-otp/',
  },

  // Social - Friends
  FRIENDS: {
    SEND_REQUEST: '/social/friends/request/',
    REQUESTS: '/social/friends/requests/',
    RESPOND_REQUEST: (userId) => `/social/friends/requests/${userId}/response/`,
    LIST: '/social/friends/',
    UNFRIEND: (userId) => `/social/friends/${userId}/unfriend/`,
    SUGGESTIONS: '/social/friends/suggestions/',
  },

  // Social - Posts
  POSTS: {
    CREATE: '/social/posts/create/',
    LIST: '/social/posts/',
    DETAIL: (postId) => `/social/posts/${postId}/`,
    UPDATE: (postId) => `/social/posts/${postId}/`,
    DELETE: (postId) => `/social/posts/${postId}/`,
    LIKE: (postId) => `/social/posts/${postId}/like/`,
    COMMENTS: (postId) => `/social/posts/${postId}/comments/`,
  },

  // Social - Comments
  COMMENTS: {
    DETAIL: (commentId) => `/social/comments/${commentId}/`,
    UPDATE: (commentId) => `/social/comments/${commentId}/`,
    DELETE: (commentId) => `/social/comments/${commentId}/`,
    LIKE: (commentId) => `/social/comments/${commentId}/like/`,
  },

  // Social - Societies
  SOCIETIES: {
    LIST: '/social/societies/',
    CREATE: '/social/societies/create/',
    DETAIL: (societyId) => `/social/societies/${societyId}/`,
    UPDATE: (societyId) => `/social/societies/${societyId}/`,
    DELETE: (societyId) => `/social/societies/${societyId}/`,
    JOIN: (societyId) => `/social/societies/${societyId}/join/`,
    LEAVE: (societyId) => `/social/societies/${societyId}/leave/`,
    MEMBERS: (societyId) => `/social/societies/${societyId}/members/`,
    POSTS: (societyId) => `/social/societies/${societyId}/posts/`,
  },

  // Social - Stories
  STORIES: {
    LIST: '/social/stories/',
    CREATE: '/social/stories/create/',
    DETAIL: (storyId) => `/social/stories/${storyId}/`,
    DELETE: (storyId) => `/social/stories/${storyId}/`,
  },

  // Social - Notifications
  NOTIFICATIONS: {
    LIST: '/social/notifications/',
    MARK_READ: '/social/notifications/mark-read/',
  },

  // Social - User Blocking
  USERS: {
    BLOCK: (userId) => `/social/users/${userId}/block/`,
    UNBLOCK: (userId) => `/social/users/${userId}/unblock/`,
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations/',
    CONVERSATION_DETAIL: (conversationId) => `/chat/conversations/${conversationId}/`,
    CREATE_CONVERSATION: '/chat/conversations/',
    DELETE_CONVERSATION: (conversationId) => `/chat/conversations/${conversationId}/`,
    SEARCH_FRIENDS: '/chat/conversations/search_friends/',
    MESSAGES: (conversationId) => `/chat/conversations/${conversationId}/messages/`,
    SEND_MESSAGE: (conversationId) => `/chat/conversations/${conversationId}/send_message/`,
    MARK_AS_READ: (conversationId) => `/chat/conversations/${conversationId}/mark_as_read/`,
    UNREAD_COUNT: '/chat/conversations/unread_count/',
    GLOBAL_CHAT: '/chat/global-chat/',
    SEND_GLOBAL_MESSAGE: '/chat/global-chat/send_message/',
    // Call endpoints
    CALLS: '/chat/calls/',
    CONVERSATION_CALLS: '/chat/calls/conversation_calls/',
    END_CALL: (callId) => `/chat/calls/${callId}/end_call/`,
  },

  // Shop
  SHOP: {
    CATEGORIES: '/shop/categories/',
    CATEGORY_DETAIL: (categoryId) => `/shop/categories/${categoryId}/`,
    PRODUCTS: '/shop/products/',
    PRODUCT_DETAIL: (productId) => `/shop/products/${productId}/`,
    SUGGESTED_PRODUCTS: (productId) => `/shop/products/${productId}/suggested/`,
    MY_PRODUCTS: '/shop/products/my-products/',
    PENDING_PRODUCTS: '/shop/products/pending/',
    APPROVE_PRODUCT: (productId) => `/shop/products/${productId}/approve/`,
    REJECT_PRODUCT: (productId) => `/shop/products/${productId}/reject/`,
    ADD_IMAGE: (productId) => `/shop/products/${productId}/add-image/`,
    DELETE_IMAGE: (productId, imageId) => `/shop/products/${productId}/delete-image/${imageId}/`,
    CART: '/shop/cart/',
    ADD_TO_CART: '/shop/cart/add-item/',
    UPDATE_CART_ITEM: (itemId) => `/shop/cart/update-item/${itemId}/`,
    REMOVE_CART_ITEM: (itemId) => `/shop/cart/remove-item/${itemId}/`,
    CLEAR_CART: '/shop/cart/clear/',
    ORDERS: '/shop/orders/',
    ORDER_DETAIL: (orderId) => `/shop/orders/${orderId}/`,
    CHECKOUT: '/shop/orders/checkout/',
    BUY_NOW: '/shop/orders/buy-now/',
    UPDATE_ORDER_STATUS: (orderId) => `/shop/orders/${orderId}/update-status/`,
  },
};

// WebSocket URLs
export const WS_BASE_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://10.10.13.99';
export const WS_ENDPOINTS = {
  PRIVATE_CHAT: (conversationId) => `${WS_BASE_URL}/ws/chat/${conversationId}/`,
  GLOBAL_CHAT: `${WS_BASE_URL}/ws/global-chat/`,
  CALL: (conversationId) => `${WS_BASE_URL}/ws/call/${conversationId}/`,
};
