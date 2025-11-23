/**
 * Query Keys Factory
 * 
 * Centralized query key management using factory pattern.
 * This ensures consistent cache management and easy invalidation.
 * 
 * Benefits:
 * - Type-safe query keys
 * - Easy to invalidate related queries
 * - Prevents typos and inconsistencies
 * - Self-documenting cache structure
 */

export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'],
    currentUser: () => [...queryKeys.auth.all, 'current-user'],
    profile: (userId) => [...queryKeys.auth.all, 'profile', userId],
  },

  // Posts / Feed
  posts: {
    all: ['posts'],
    lists: () => [...queryKeys.posts.all, 'list'],
    list: (filters) => [...queryKeys.posts.lists(), filters],
    infinite: (filters) => [...queryKeys.posts.all, 'infinite', filters],
    details: () => [...queryKeys.posts.all, 'detail'],
    detail: (postId) => [...queryKeys.posts.details(), postId],
    comments: (postId) => [...queryKeys.posts.all, 'comments', postId],
    likes: (postId) => [...queryKeys.posts.all, 'likes', postId],
  },

  // Societies
  societies: {
    all: ['societies'],
    lists: () => [...queryKeys.societies.all, 'list'],
    list: (filters) => [...queryKeys.societies.lists(), filters],
    details: () => [...queryKeys.societies.all, 'detail'],
    detail: (societyId) => [...queryKeys.societies.details(), societyId],
    posts: (societyId) => [...queryKeys.societies.all, 'posts', societyId],
    members: (societyId) => [...queryKeys.societies.all, 'members', societyId],
    mySocieties: () => [...queryKeys.societies.all, 'my-societies'],
    pending: (societyId) => [...queryKeys.societies.all, 'pending', societyId],
  },

  // Friends
  friends: {
    all: ['friends'],
    lists: () => [...queryKeys.friends.all, 'list'],
    list: (userId) => [...queryKeys.friends.lists(), userId],
    requests: () => [...queryKeys.friends.all, 'requests'],
    sent: () => [...queryKeys.friends.all, 'sent'],
    suggestions: () => [...queryKeys.friends.all, 'suggestions'],
  },

  // Chat / Messaging
  chat: {
    all: ['chat'],
    conversations: () => [...queryKeys.chat.all, 'conversations'],
    conversation: (conversationId) => [...queryKeys.chat.all, 'conversation', conversationId],
    messages: (conversationId) => [...queryKeys.chat.all, 'messages', conversationId],
    globalMessages: () => [...queryKeys.chat.all, 'global-messages'],
    unreadCount: () => [...queryKeys.chat.all, 'unread-count'],
    searchFriends: (query) => [...queryKeys.chat.all, 'search-friends', query],
  },

  // Messages / Chat (legacy - keeping for backwards compatibility)
  messages: {
    all: ['messages'],
    conversations: () => [...queryKeys.messages.all, 'conversations'],
    conversation: (conversationId) => [...queryKeys.messages.all, 'conversation', conversationId],
    infinite: (conversationId) => [...queryKeys.messages.all, 'infinite', conversationId],
  },

  // Products / Marketplace
  products: {
    all: ['products'],
    lists: () => [...queryKeys.products.all, 'list'],
    list: (filters) => [...queryKeys.products.lists(), filters],
    details: () => [...queryKeys.products.all, 'detail'],
    detail: (productId) => [...queryKeys.products.details(), productId],
    myProducts: () => [...queryKeys.products.all, 'my-products'],
    categories: () => [...queryKeys.products.all, 'categories'],
  },

  // Shopping Cart
  cart: {
    all: ['cart'],
    items: () => [...queryKeys.cart.all, 'items'],
    summary: () => [...queryKeys.cart.all, 'summary'],
  },

  // Notifications
  notifications: {
    all: ['notifications'],
    list: () => [...queryKeys.notifications.all, 'list'],
    unread: () => [...queryKeys.notifications.all, 'unread'],
    count: () => [...queryKeys.notifications.all, 'count'],
  },

  // User Profile
  profile: {
    all: ['profile'],
    details: (userId) => [...queryKeys.profile.all, 'detail', userId],
    posts: (userId) => [...queryKeys.profile.all, 'posts', userId],
    friends: (userId) => [...queryKeys.profile.all, 'friends', userId],
  },
};

/**
 * Helper function to invalidate all queries with a specific prefix
 * Usage: invalidateQueriesByPrefix(queryClient, queryKeys.posts.all)
 */
export const invalidateQueriesByPrefix = (queryClient, queryKey) => {
  return queryClient.invalidateQueries({ queryKey });
};

/**
 * Helper function to remove all queries with a specific prefix
 * Usage: removeQueriesByPrefix(queryClient, queryKeys.auth.all)
 */
export const removeQueriesByPrefix = (queryClient, queryKey) => {
  return queryClient.removeQueries({ queryKey });
};

export default queryKeys;
