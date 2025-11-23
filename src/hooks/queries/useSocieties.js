import { useQuery } from '@tanstack/react-query'
import { apiMethods } from '../../utils/api'
import { ENDPOINTS } from '../../config/apiConfig'
import { queryKeys } from '../../utils/queryKeys'

/**
 * Fetch all societies with optional filters
 * @param {Object} filters - Optional filters (search, category, etc.)
 * @returns {UseQueryResult}
 */
export const useSocieties = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString()
      const url = params ? `${ENDPOINTS.SOCIETIES.LIST}?${params}` : ENDPOINTS.SOCIETIES.LIST
      const response = await apiMethods.get(url)
      return response.data.results || response.data
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  })
}

/**
 * Fetch a single society by ID
 * @param {string|number} societyId - Society ID
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useSociety = (societyId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.detail(societyId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SOCIETIES.DETAIL(societyId))
      return response.data
    },
    enabled: !!societyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Fetch members of a society
 * @param {string|number} societyId - Society ID
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useSocietyMembers = (societyId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.members(societyId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SOCIETIES.MEMBERS(societyId))
      return response.data.results || response.data
    },
    enabled: !!societyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Fetch societies the current user belongs to
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useUserSocieties = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.userSocieties(),
    queryFn: async () => {
      // Assuming the API returns user's societies when filtering by is_member=true
      const response = await apiMethods.get(`${ENDPOINTS.SOCIETIES.LIST}?is_member=true`)
      return response.data.results || response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Fetch societies the current user owns/manages
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useMySocieties = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.mySocieties(),
    queryFn: async () => {
      // Assuming the API returns user's owned societies when filtering by is_admin=true
      const response = await apiMethods.get(`${ENDPOINTS.SOCIETIES.LIST}?is_admin=true`)
      return response.data.results || response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Search societies by name or description
 * @param {string} searchQuery - Search query
 * @param {Object} options - Query options
 * @returns {UseQueryResult}
 */
export const useSearchSocieties = (searchQuery, options = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.search(searchQuery),
    queryFn: async () => {
      const response = await apiMethods.get(`${ENDPOINTS.SOCIETIES.LIST}?search=${encodeURIComponent(searchQuery)}`)
      return response.data.results || response.data
    },
    enabled: !!searchQuery && searchQuery.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
    ...options,
  })
}
