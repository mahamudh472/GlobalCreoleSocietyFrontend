import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiMethods } from "../../utils/api";
import { ENDPOINTS } from "../../config/apiConfig";
import { queryKeys } from "../../utils/queryKeys";

/**
 * Fetch all conversations for the current user
 */
export const useConversations = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.CHAT.CONVERSATIONS);
      const conversationsData = response.data.results || response.data;
      const conversations = Array.isArray(conversationsData)
        ? conversationsData
        : [];

      // Transform API response to match component structure
      return conversations.map((conv) => {
        const isGroup =
          !!conv.is_group || !!conv.society || conv.type === "group";
        const displayName = isGroup
          ? conv.society?.name || conv.title || conv.name || "Group"
          : conv.other_participant?.profile_name ||
            conv.other_participant?.email ||
            "Unknown User";
        const avatar = isGroup
          ? conv.society?.cover_image ||
            conv.society?.avatar ||
            "/placeholder.svg"
          : conv.other_participant?.profile_image ||
            getDefaultProfileImage(conv.other_participant);

        return {
          id: conv.id,
          name: displayName,
          avatar,
          lastMessage: conv.last_message?.content || "No messages yet",
          timestamp: conv.last_message?.created_at,
          isActive: isGroup ? true : conv.other_participant?.is_online || false,
          unread: conv.unread_count > 0,
          unreadCount: conv.unread_count || 0,
          userId: isGroup ? null : conv.other_participant?.id,
          otherParticipant: conv.other_participant,
          isGroup,
          societyId: conv.society?.id || conv.society_id || null,
        };
      });
    },
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

/**
 * Fetch messages for a specific conversation with pagination
 */
export const useConversationMessages = (conversationId, options = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: async ({ pageParam }) => {
      const url = pageParam || ENDPOINTS.CHAT.MESSAGES(conversationId);
      const response = await apiMethods.get(url);

      const messageData = response.data.results || response.data;
      const messages = Array.isArray(messageData) ? messageData : [];

      // Get current user ID from localStorage for ownership check
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = currentUser.id;

      return {
        messages: messages.map((msg) => ({
          id: msg.id,
          text: msg.content,
          timestamp: msg.created_at,
          // Determine ownership: use is_own from API if available, otherwise compare sender ID
          isOwn:
            msg.is_own !== undefined
              ? msg.is_own
              : msg.sender?.id === currentUserId,
          senderId: msg.sender?.id,
          senderName:
            msg.sender?.profile_name || msg.sender?.email || "Unknown",
          senderAvatar:
            msg.sender?.profile_image || getDefaultProfileImage(msg.sender),
          file_url: msg.file_url,
          file_type: msg.file_type,
        })),
        nextPage: response.data.next,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: null,
    enabled: !!conversationId,
    staleTime: 10000, // 10 seconds
    ...options,
  });
};

/**
 * Fetch global chat messages with infinite scroll
 */
export const useGlobalMessages = (options = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.globalMessages(),
    queryFn: async ({ pageParam }) => {
      const url = pageParam || ENDPOINTS.CHAT.GLOBAL_CHAT;
      const response = await apiMethods.get(url);

      const messageData = response.data.results || response.data;
      const messages = Array.isArray(messageData) ? messageData : [];

      // Get current user ID from localStorage for ownership check
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = currentUser.id;

      return {
        messages: messages.map((msg) => ({
          id: msg.id,
          text: msg.content,
          timestamp: msg.created_at,
          // Determine ownership: use is_own from API if available, otherwise compare sender ID
          isOwn:
            msg.is_own !== undefined
              ? msg.is_own
              : msg.sender?.id === currentUserId,
          senderId: msg.sender?.id,
          senderName:
            msg.sender?.profile_name || msg.sender?.email || "Unknown",
          senderAvatar:
            msg.sender?.profile_image || getDefaultProfileImage(msg.sender),
          file_url: msg.file_url,
          file_type: msg.file_type,
        })),
        nextPage: response.data.next,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: null,
    staleTime: 10000, // 10 seconds
    ...options,
  });
};

/**
 * Fetch unread message count
 */
export const useUnreadCount = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.chat.unreadCount(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.CHAT.UNREAD_COUNT);
      return response.data.unread_count || 0;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
};

/**
 * Search friends for creating new conversation
 */
export const useSearchFriendsForChat = (query, options = {}) => {
  return useQuery({
    queryKey: queryKeys.chat.searchFriends(query),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.CHAT.SEARCH_FRIENDS, {
        params: { search: query },
      });
      const friendsData = response.data.results || response.data;
      return Array.isArray(friendsData) ? friendsData : [];
    },
    enabled: !!query && query.length > 0,
    staleTime: 60000, // 1 minute
    ...options,
  });
};

// Helper function for default profile image
const getDefaultProfileImage = (user) => {
  if (!user)
    return "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff";
  const name = user.profile_name || user.email || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=150&background=3b82f6&color=fff`;
};
