import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';
import { toast } from 'react-toastify';

/**
 * Add item to cart mutation
 */
export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.ADD_TO_CART, {
        product_id: productId,
        quantity,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
      toast.success('Item added to cart!');
    },
    onError: (error) => {
      console.error('Add to cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    },
  });
};

/**
 * Update cart item quantity mutation
 */
export const useUpdateCartItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      const response = await apiMethods.patch(ENDPOINTS.SHOP.UPDATE_CART_ITEM(itemId), {
        quantity,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
    onError: (error) => {
      console.error('Update cart item error:', error);
      toast.error(error.response?.data?.message || 'Failed to update cart item');
    },
  });
};

/**
 * Remove item from cart mutation
 */
export const useRemoveCartItemMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId) => {
      await apiMethods.delete(ENDPOINTS.SHOP.REMOVE_CART_ITEM(itemId));
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
      toast.success('Item removed from cart');
    },
    onError: (error) => {
      console.error('Remove cart item error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });
};

/**
 * Clear entire cart mutation
 */
export const useClearCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiMethods.post(ENDPOINTS.SHOP.CLEAR_CART);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
      toast.success('Cart cleared');
    },
    onError: (error) => {
      console.error('Clear cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
  });
};

/**
 * Checkout mutation
 */
export const useCheckoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkoutData) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.CHECKOUT, checkoutData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });
};
