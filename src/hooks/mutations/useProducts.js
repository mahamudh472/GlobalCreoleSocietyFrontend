import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';
import { toast } from 'react-toastify';

/**
 * Create Product Mutation Hook
 * 
 * Handles product creation with file uploads
 * Automatically invalidates product lists on success
 * 
 * @returns {object} Mutation object
 * 
 * @example
 * const createProduct = useCreateProductMutation();
 * createProduct.mutate({ name, price, description, image });
 */
export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData) => {
      // Build FormData for multipart upload
      const formData = new FormData();
      
      // Use 'name' field (backend expects 'name', not 'title')
      formData.append('name', productData.name || productData.title);
      formData.append('price', productData.price);
      formData.append('description', productData.description);
      
      // Category should be an ID, not a string
      // If category is a string, we need to create/fetch the category first
      // For now, we'll skip if it's not a valid ID
      if (productData.category && !isNaN(productData.category)) {
        formData.append('category', productData.category);
      }
      
      // Stock (default to 0 if not provided)
      formData.append('stock', productData.stock || 0);
      
      // Handle multiple images - backend expects 'uploaded_images' field
      if (productData.media && Array.isArray(productData.media)) {
        productData.media.forEach((mediaItem) => {
          if (mediaItem.file) {
            formData.append('uploaded_images', mediaItem.file);
          }
        });
      }
      
      // Also handle if images are passed directly
      if (productData.images && Array.isArray(productData.images)) {
        productData.images.forEach((img) => {
          formData.append('uploaded_images', img);
        });
      }
      
      // Handle single image
      if (productData.image) {
        formData.append('uploaded_images', productData.image);
      }
      
      const response = await apiMethods.post(ENDPOINTS.SHOP.PRODUCTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    },
    onSuccess: (newProduct) => {
      // Invalidate and refetch product queries
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.myProducts() });
      
      toast.success('Product created successfully!');
    },
    onError: (error) => {
      console.error('Create product error:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.detail 
        || 'Failed to create product';
      toast.error(errorMessage);
    },
  });
};

/**
 * Update Product Mutation Hook
 * 
 * Handles product updates with optimistic updates
 * 
 * @returns {object} Mutation object
 */
export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, productData }) => {
      // If productData is already FormData, use it directly
      let formData;
      if (productData instanceof FormData) {
        formData = productData;
      } else {
        // Otherwise, create FormData from object
        formData = new FormData();
        
        // Add fields only if they exist
        if (productData.name) formData.append('name', productData.name);
        if (productData.price) formData.append('price', productData.price);
        if (productData.description) formData.append('description', productData.description);
        if (productData.category) formData.append('category', productData.category);
        if (productData.stock !== undefined) formData.append('stock', productData.stock);
        if (productData.image) formData.append('image', productData.image);
        
        // Handle uploaded_images array
        if (productData.uploaded_images) {
          productData.uploaded_images.forEach((image) => {
            formData.append('uploaded_images', image);
          });
        }
      }
      
      const response = await apiMethods.patch(
        ENDPOINTS.SHOP.PRODUCT_DETAIL(productId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    },
    onMutate: async ({ productId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(productId) });

      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(productId));

      return { previousProduct };
    },
    onSuccess: (updatedProduct, { productId }) => {
      // Update the cache with server response
      queryClient.setQueryData(queryKeys.products.detail(productId), updatedProduct);
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.myProducts() });
      
      toast.success('Product updated successfully!');
    },
    onError: (error, { productId }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(productId), context.previousProduct);
      }
      
      console.error('Update product error:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });
};

/**
 * Delete Product Mutation Hook
 * 
 * Handles product deletion with cache cleanup
 * 
 * @returns {object} Mutation object
 */
export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId) => {
      await apiMethods.delete(ENDPOINTS.SHOP.PRODUCT_DETAIL(productId));
      return productId;
    },
    onSuccess: (productId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(productId) });
      
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.myProducts() });
      
      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete product error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });
};
