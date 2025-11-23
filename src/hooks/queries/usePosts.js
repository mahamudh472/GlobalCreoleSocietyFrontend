import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';

/**
 * Infinite Posts Query Hook
 * 
 * Fetches posts with infinite scroll pagination
 * Automatically handles loading more posts as user scrolls
 * 
 * @param {object} filters - Optional filters (society_id, user_id, etc.)
 * @returns {object} Query object with pages of posts, fetchNextPage, hasNextPage, etc.
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePostsInfinite();
 * const posts = data?.pages.flatMap(page => page.results) ?? [];
 */
export const usePostsInfinite = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.infinite(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam,
        ...filters,
      });
      
      const response = await apiMethods.get(`${ENDPOINTS.POSTS.LIST}?${params}`);
      return {
        results: response.data.results || response.data,
        next: response.data.next,
        page: pageParam,
      };
    },
    getNextPageParam: (lastPage) => {
      // If there's a next URL, increment page number
      if (lastPage.next) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Single Post Query Hook
 * 
 * Fetches a single post by ID
 * 
 * @param {string|number} postId - The ID of the post to fetch
 * @param {object} options - Additional query options
 * @returns {object} Query object with post data
 * 
 * @example
 * const { data: post, isLoading } = usePost(postId);
 */
export const usePost = (postId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.POSTS.DETAIL(postId));
      return response.data;
    },
    enabled: !!postId && options.enabled !== false,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

/**
 * Post Comments Query Hook
 * 
 * Fetches all comments for a specific post
 * 
 * @param {string|number} postId - The ID of the post
 * @param {object} options - Additional query options
 * @returns {object} Query object with comments array
 * 
 * @example
 * const { data: comments, isLoading } = usePostComments(postId);
 */
export const usePostComments = (postId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.comments(postId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.POSTS.COMMENTS(postId));
      return response.data.results || response.data;
    },
    enabled: !!postId && options.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute (comments update frequently)
    ...options,
  });
};

/**
 * Post Likes Query Hook
 * 
 * Fetches users who liked a specific post
 * 
 * @param {string|number} postId - The ID of the post
 * @param {object} options - Additional query options
 * @returns {object} Query object with likes array
 * 
 * @example
 * const { data: likes, isLoading } = usePostLikes(postId);
 */
export const usePostLikes = (postId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.posts.likes(postId),
    queryFn: async () => {
      // Assuming there's an endpoint for getting post likes
      // Adjust if your API structure is different
      const response = await apiMethods.get(`${ENDPOINTS.POSTS.DETAIL(postId)}/likes/`);
      return response.data.results || response.data;
    },
    enabled: !!postId && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Society Posts Query Hook
 * 
 * Fetches posts for a specific society
 * 
 * @param {string|number} societyId - The ID of the society
 * @param {object} options - Additional query options
 * @returns {object} Query object with society posts
 * 
 * @example
 * const { data: posts, isLoading } = useSocietyPosts(societyId);
 */
export const useSocietyPosts = (societyId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.societies.posts(societyId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SOCIETIES.POSTS(societyId));
      return response.data.results || response.data;
    },
    enabled: !!societyId && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * User Posts Query Hook
 * 
 * Fetches posts created by a specific user
 * Already exported from useUser.js but included here for completeness
 * 
 * @param {string|number} userId - The ID of the user
 * @param {object} options - Additional query options
 * @returns {object} Query object with user posts
 */
export const useUserPostsQuery = (userId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.profile.posts(userId),
    queryFn: async () => {
      const response = await apiMethods.get(`${ENDPOINTS.POSTS.LIST}?user=${userId}`);
      return response.data.results || response.data;
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};
