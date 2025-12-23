import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';
import { toast } from 'react-toastify';

/**
 * Create Post Mutation Hook
 * 
 * Handles creating new posts with automatic cache updates
 * Supports text, images, and videos
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const createPost = useCreatePostMutation();
 * createPost.mutate({ 
 *   content: "Hello", 
 *   media: [file1, file2],
 *   society: societyId 
 * });
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData) => {
      // If postData is already FormData, send it directly
      if (postData instanceof FormData) {
        const response = await apiMethods.post(ENDPOINTS.POSTS.CREATE, postData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      }
      
      // If there are media files, use FormData
      if (postData.media && postData.media.length > 0) {
        const response = await apiMethods.postForm(ENDPOINTS.POSTS.CREATE, postData);
        return response.data;
      } else {
        // Regular JSON post
        const response = await apiMethods.post(ENDPOINTS.POSTS.CREATE, postData);
        return response.data;
      }
    },
    onSuccess: (newPost) => {
      // Invalidate posts queries to refetch with new post
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      
      // If society post, invalidate society posts
      // society can be an object with id or a direct UUID string
      const societyId = newPost.society?.id || newPost.society;
      if (societyId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.societies.posts(societyId) 
        });
      }
      
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      console.error('Create post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create post');
    },
  });
};

/**
 * Like/Unlike Post Mutation Hook
 * 
 * Handles liking and unliking posts with optimistic updates
 * Automatically updates UI before server responds
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const likePost = useLikePostMutation();
 * likePost.mutate({ postId: 123, isLiked: false });
 */
export const useLikePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }) => {
      const response = await apiMethods.post(ENDPOINTS.POSTS.LIKE(postId));
      return response.data;
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(queryKeys.posts.detail(postId));

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.posts.detail(postId), (old) => {
        if (!old) return old;
        return {
          ...old,
          is_liked: !isLiked,
          likes_count: isLiked ? old.likes_count - 1 : old.likes_count + 1,
        };
      });

      // Also update in infinite query if exists
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.all },
        (old) => {
          if (!old) return old;
          
          // Handle infinite query structure
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                results: page.results.map(post =>
                  post.id === postId
                    ? {
                        ...post,
                        is_liked: !isLiked,
                        likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
                      }
                    : post
                ),
              })),
            };
          }
          
          // Handle regular query structure
          if (Array.isArray(old)) {
            return old.map(post =>
              post.id === postId
                ? {
                    ...post,
                    is_liked: !isLiked,
                    likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
                  }
                : post
            );
          }
          
          return old;
        }
      );

      return { previousPost };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.posts.detail(variables.postId),
          context.previousPost
        );
      }
      toast.error('Failed to like post');
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.posts.detail(variables.postId) 
      });
    },
  });
};

/**
 * Delete Post Mutation Hook
 * 
 * Handles deleting posts with automatic cache updates
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const deletePost = useDeletePostMutation();
 * deletePost.mutate(postId);
 */
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId) => {
      await apiMethods.delete(ENDPOINTS.POSTS.DELETE(postId));
      return postId;
    },
    onMutate: async (postId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });

      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.all },
        (old) => {
          if (!old) return old;
          
          // Handle infinite query
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                results: page.results.filter(post => post.id !== postId),
              })),
            };
          }
          
          // Handle regular query
          if (Array.isArray(old)) {
            return old.filter(post => post.id !== postId);
          }
          
          return old;
        }
      );

      toast.success('Post deleted');
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
    onError: (error) => {
      console.error('Delete post error:', error);
      toast.error('Failed to delete post');
      // Refetch to restore deleted post on error
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

/**
 * Create Comment Mutation Hook
 * 
 * Handles adding comments to posts
 * Automatically updates comment count
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const addComment = useCreateCommentMutation();
 * addComment.mutate({ postId: 123, content: "Nice post!" });
 */
export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, media }) => {
      const commentData = { content, media };
      const response = await apiMethods.post(
        ENDPOINTS.POSTS.COMMENTS(postId),
        commentData
      );
      return { ...response.data, postId };
    },
    onSuccess: (data, variables) => {
      const { postId } = variables;
      
      // Invalidate comments query
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.posts.comments(postId) 
      });
      
      // Update comment count in post
      queryClient.setQueryData(queryKeys.posts.detail(postId), (old) => {
        if (!old) return old;
        return {
          ...old,
          comment_count: (old.comment_count || 0) + 1,
        };
      });
      
      // Update in infinite queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.all },
        (old) => {
          if (!old) return old;
          
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                results: page.results.map(post =>
                  post.id === postId
                    ? { ...post, comment_count: (post.comment_count || 0) + 1 }
                    : post
                ),
              })),
            };
          }
          
          if (Array.isArray(old)) {
            return old.map(post =>
              post.id === postId
                ? { ...post, comment_count: (post.comment_count || 0) + 1 }
                : post
            );
          }
          
          return old;
        }
      );
      
      toast.success('Comment added!');
    },
    onError: (error) => {
      console.error('Create comment error:', error);
      toast.error('Failed to add comment');
    },
  });
};

/**
 * Like Comment Mutation Hook
 * 
 * Handles liking/unliking comments
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const likeComment = useLikeCommentMutation();
 * likeComment.mutate({ commentId: 456, postId: 123 });
 */
export const useLikeCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }) => {
      const response = await apiMethods.post(ENDPOINTS.COMMENTS.LIKE(commentId));
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate comments to refetch with updated likes
      if (variables.postId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.posts.comments(variables.postId) 
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to like comment');
    },
  });
};

/**
 * Update Post Mutation Hook
 * 
 * Handles editing existing posts
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const updatePost = useUpdatePostMutation();
 * updatePost.mutate({ postId: 123, content: "Updated content" });
 */
export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, ...updateData }) => {
      const response = await apiMethods.patch(
        ENDPOINTS.POSTS.UPDATE(postId),
        updateData
      );
      return response.data;
    },
    onSuccess: (updatedPost) => {
      // Update post in cache
      queryClient.setQueryData(
        queryKeys.posts.detail(updatedPost.id),
        updatedPost
      );
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      
      toast.success('Post updated successfully!');
    },
    onError: (error) => {
      console.error('Update post error:', error);
      toast.error('Failed to update post');
    },
  });
};
