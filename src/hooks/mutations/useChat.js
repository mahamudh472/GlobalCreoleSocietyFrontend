import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';
import { toast } from 'react-toastify';

/**
 * Create a new conversation with a user
 */
export const useCreateConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId) => {
      const response = await apiMethods.post(ENDPOINTS.CHAT.CREATE_CONVERSATION, {
        participant_id: participantId
      });
      return response.data;
    },
    onSuccess: (newConversation) => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
      toast.success('Conversation created!');
    },
    onError: (error) => {
      console.error('Error creating conversation:', error);
      toast.error(error.response?.data?.error || 'Failed to create conversation');
    },
  });
};

/**
 * Send a message in a private conversation
 */
export const useSendMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, file }) => {
      const formData = new FormData();
      formData.append('content', content);
      if (file) {
        formData.append('file', file);
      }

      const response = await apiMethods.post(
        ENDPOINTS.CHAT.SEND_MESSAGE(conversationId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (newMessage, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.chat.messages(variables.conversationId) 
      });
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    },
  });
};

/**
 * Send a message in global chat
 */
export const useSendGlobalMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, file }) => {
      const formData = new FormData();
      formData.append('content', content);
      if (file) {
        formData.append('file', file);
      }

      const response = await apiMethods.post(
        ENDPOINTS.CHAT.SEND_GLOBAL_MESSAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate global messages
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.globalMessages() });
    },
    onError: (error) => {
      console.error('Error sending global message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    },
  });
};

/**
 * Mark conversation as read
 */
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId) => {
      const response = await apiMethods.post(ENDPOINTS.CHAT.MARK_AS_READ(conversationId));
      return response.data;
    },
    onSuccess: (_, conversationId) => {
      // Update the conversation in cache
      queryClient.setQueryData(queryKeys.chat.conversations(), (old) => {
        if (!old) return old;
        return old.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread: false, unreadCount: 0 }
            : conv
        );
      });
      
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
    },
    onError: (error) => {
      console.error('Error marking as read:', error);
    },
  });
};

/**
 * Delete a conversation
 */
export const useDeleteConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId) => {
      await apiMethods.delete(ENDPOINTS.CHAT.DELETE_CONVERSATION(conversationId));
      return conversationId;
    },
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.conversations() });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(queryKeys.chat.conversations());

      // Optimistically remove conversation
      queryClient.setQueryData(queryKeys.chat.conversations(), (old) => {
        if (!old) return old;
        return old.filter(conv => conv.id !== conversationId);
      });

      return { previousConversations };
    },
    onSuccess: () => {
      toast.success('Conversation deleted');
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.chat.conversations(),
          context.previousConversations
        );
      }
      console.error('Error deleting conversation:', error);
      toast.error(error.response?.data?.error || 'Failed to delete conversation');
    },
  });
};
