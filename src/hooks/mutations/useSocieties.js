import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiMethods } from '../../utils/api'
import { ENDPOINTS } from '../../config/apiConfig'
import { queryKeys } from '../../utils/queryKeys'
import { toast } from 'react-toastify'

/**
 * Create a new society
 * Automatically invalidates society lists on success
 * @returns {UseMutationResult}
 */
export const useCreateSocietyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (societyData) => {
      const response = await apiMethods.post(ENDPOINTS.SOCIETIES.CREATE, societyData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: (newSociety) => {
      // Invalidate all society lists
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.mySocieties() })
      
      toast.success('Society created successfully!')
    },
    onError: (error) => {
      console.error('Error creating society:', error)
      toast.error(error.response?.data?.message || 'Failed to create society')
    },
  })
}

/**
 * Update society details
 * Optimistically updates cache
 * @returns {UseMutationResult}
 */
export const useUpdateSocietyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ societyId, societyData }) => {
      const response = await apiMethods.put(ENDPOINTS.SOCIETIES.UPDATE(societyId), societyData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onMutate: async ({ societyId, societyData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.societies.detail(societyId) })

      // Snapshot previous value
      const previousSociety = queryClient.getQueryData(queryKeys.societies.detail(societyId))

      // Optimistically update
      if (previousSociety) {
        queryClient.setQueryData(queryKeys.societies.detail(societyId), {
          ...previousSociety,
          ...societyData,
        })
      }

      return { previousSociety }
    },
    onSuccess: (updatedSociety, { societyId }) => {
      // Update the cache with server response
      queryClient.setQueryData(queryKeys.societies.detail(societyId), updatedSociety)
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.mySocieties() })
      
      toast.success('Society updated successfully!')
    },
    onError: (error, { societyId }, context) => {
      // Rollback on error
      if (context?.previousSociety) {
        queryClient.setQueryData(queryKeys.societies.detail(societyId), context.previousSociety)
      }
      
      console.error('Error updating society:', error)
      toast.error(error.response?.data?.message || 'Failed to update society')
    },
  })
}

/**
 * Delete a society
 * Removes from cache on success
 * @returns {UseMutationResult}
 */
export const useDeleteSocietyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (societyId) => {
      await apiMethods.delete(ENDPOINTS.SOCIETIES.DELETE(societyId))
      return societyId
    },
    onSuccess: (societyId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.societies.detail(societyId) })
      
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.mySocieties() })
      
      toast.success('Society deleted successfully!')
    },
    onError: (error) => {
      console.error('Error deleting society:', error)
      toast.error(error.response?.data?.message || 'Failed to delete society')
    },
  })
}

/**
 * Join a society
 * Optimistically updates member count and membership status
 * @returns {UseMutationResult}
 */
export const useJoinSocietyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (societyId) => {
      const response = await apiMethods.post(ENDPOINTS.SOCIETIES.JOIN(societyId))
      return { societyId, data: response.data }
    },
    onMutate: async (societyId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.societies.detail(societyId) })

      // Snapshot previous value
      const previousSociety = queryClient.getQueryData(queryKeys.societies.detail(societyId))

      // Optimistically update
      if (previousSociety) {
        queryClient.setQueryData(queryKeys.societies.detail(societyId), {
          ...previousSociety,
          is_member: true,
          member_count: (previousSociety.member_count || 0) + 1,
        })
      }

      return { previousSociety }
    },
    onSuccess: ({ societyId, data }) => {
      // Invalidate and refetch society detail to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.detail(societyId) })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.members(societyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.mySocieties() })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.lists() })
      
      toast.success('Successfully joined society!')
    },
    onError: (error, societyId, context) => {
      // Rollback on error
      if (context?.previousSociety) {
        queryClient.setQueryData(queryKeys.societies.detail(societyId), context.previousSociety)
      }
      
      console.error('Error joining society:', error)
      toast.error(error.response?.data?.message || 'Failed to join society')
    },
  })
}

/**
 * Leave a society
 * Optimistically updates member count and membership status
 * @returns {UseMutationResult}
 */
export const useLeaveSocietyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (societyId) => {
      const response = await apiMethods.delete(ENDPOINTS.SOCIETIES.LEAVE(societyId))
      return { societyId, data: response.data }
    },
    onMutate: async (societyId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.societies.detail(societyId) })

      // Snapshot previous value
      const previousSociety = queryClient.getQueryData(queryKeys.societies.detail(societyId))

      // Optimistically update
      if (previousSociety) {
        queryClient.setQueryData(queryKeys.societies.detail(societyId), {
          ...previousSociety,
          is_member: false,
          member_count: Math.max((previousSociety.member_count || 1) - 1, 0),
        })
      }

      return { previousSociety }
    },
    onSuccess: ({ societyId, data }) => {
      // Invalidate and refetch society detail to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.detail(societyId) })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.members(societyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.mySocieties() })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.lists() })
      
      toast.success('Successfully left society')
    },
    onError: (error, societyId, context) => {
      // Rollback on error
      if (context?.previousSociety) {
        queryClient.setQueryData(queryKeys.societies.detail(societyId), context.previousSociety)
      }
      
      console.error('Error leaving society:', error)
      toast.error(error.response?.data?.message || 'Failed to leave society')
    },
  })
}

/**
 * Remove a member from a society (admin only)
 * @returns {UseMutationResult}
 */
export const useRemoveMemberMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ societyId, memberId }) => {
      // Assuming there's an endpoint for this
      const response = await apiMethods.post(`${ENDPOINTS.SOCIETIES.DETAIL(societyId)}/remove-member/`, {
        member_id: memberId,
      })
      return { societyId, memberId, data: response.data }
    },
    onSuccess: ({ societyId }) => {
      // Invalidate members list and society detail
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.members(societyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.societies.detail(societyId) })
      
      toast.success('Member removed successfully')
    },
    onError: (error) => {
      console.error('Error removing member:', error)
      toast.error(error.response?.data?.message || 'Failed to remove member')
    },
  })
}
