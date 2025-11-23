import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiMethods } from '../../utils/api'
import { ENDPOINTS } from '../../config/apiConfig'
import { queryKeys } from '../../utils/queryKeys'
import { toast } from 'react-toastify'

/**
 * Send a friend request
 * Automatically invalidates friend suggestions and requests
 * @returns {UseMutationResult}
 */
export const useSendFriendRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId) => {
      const response = await apiMethods.post(ENDPOINTS.FRIENDS.SEND_REQUEST, {
        receiver: userId
      })
      return response.data
    },
    onSuccess: () => {
      // Invalidate suggestions (user should no longer appear)
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.suggestions() })
      
      toast.success('Friend request sent!')
    },
    onError: (error) => {
      console.error('Error sending friend request:', error)
      toast.error(error.response?.data?.error || 'Failed to send friend request')
    },
  })
}

/**
 * Respond to a friend request (accept or reject)
 * Optimistically updates friend lists
 * @returns {UseMutationResult}
 */
export const useRespondToRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, action }) => {
      // action should be 'accept' or 'reject'
      const response = await apiMethods.post(ENDPOINTS.FRIENDS.RESPOND_REQUEST(userId), {
        action
      })
      return { userId, action, data: response.data }
    },
    onMutate: async ({ userId, action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.friends.requests() })

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(queryKeys.friends.requests())

      // Optimistically update - remove request from list
      if (previousRequests) {
        queryClient.setQueryData(
          queryKeys.friends.requests(),
          previousRequests.filter(request => request.id !== userId && request.sender?.id !== userId)
        )
      }

      return { previousRequests }
    },
    onSuccess: ({ userId, action }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests() })
      
      if (action === 'accept') {
        // If accepted, invalidate friends list to show new friend
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.list() })
        toast.success('Friend request accepted!')
      } else {
        toast.success('Friend request rejected')
      }
    },
    onError: (error, { userId, action }, context) => {
      // Rollback on error
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKeys.friends.requests(), context.previousRequests)
      }
      
      console.error('Error responding to friend request:', error)
      toast.error(error.response?.data?.error || 'Failed to respond to request')
    },
  })
}

/**
 * Unfriend a user
 * Optimistically updates friend list
 * @returns {UseMutationResult}
 */
export const useUnfriendMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId) => {
      await apiMethods.post(ENDPOINTS.FRIENDS.UNFRIEND(userId))
      return userId
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.friends.list() })

      // Snapshot previous value
      const previousFriends = queryClient.getQueryData(queryKeys.friends.list())

      // Optimistically update - remove friend from list
      if (previousFriends) {
        queryClient.setQueryData(
          queryKeys.friends.list(),
          previousFriends.filter(friend => friend.id !== userId)
        )
      }

      return { previousFriends }
    },
    onSuccess: (userId) => {
      // Invalidate friends list
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.list() })
      
      // Also invalidate suggestions (might reappear there)
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.suggestions() })
      
      toast.success('Friend removed')
    },
    onError: (error, userId, context) => {
      // Rollback on error
      if (context?.previousFriends) {
        queryClient.setQueryData(queryKeys.friends.list(), context.previousFriends)
      }
      
      console.error('Error unfriending user:', error)
      toast.error(error.response?.data?.error || 'Failed to unfriend user')
    },
  })
}

/**
 * Block a user
 * Removes user from friends and suggestions
 * @returns {UseMutationResult}
 */
export const useBlockUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId) => {
      const response = await apiMethods.post(ENDPOINTS.USERS.BLOCK(userId))
      return { userId, data: response.data }
    },
    onSuccess: ({ userId }) => {
      // Invalidate all friend-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.suggestions() })
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests() })
      
      toast.success('User blocked')
    },
    onError: (error) => {
      console.error('Error blocking user:', error)
      toast.error(error.response?.data?.error || 'Failed to block user')
    },
  })
}

/**
 * Unblock a user
 * @returns {UseMutationResult}
 */
export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId) => {
      const response = await apiMethods.post(ENDPOINTS.USERS.UNBLOCK(userId))
      return { userId, data: response.data }
    },
    onSuccess: ({ userId }) => {
      // Invalidate suggestions (might appear again)
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.suggestions() })
      
      toast.success('User unblocked')
    },
    onError: (error) => {
      console.error('Error unblocking user:', error)
      toast.error(error.response?.data?.error || 'Failed to unblock user')
    },
  })
}
