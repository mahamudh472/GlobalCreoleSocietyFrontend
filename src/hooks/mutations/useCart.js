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

/**
 * Buy Now mutation - instant checkout for a single product
 */
export const useBuyNowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buyNowData) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.BUY_NOW, buyNowData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      console.error('Buy now error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });
};

/**
 * Create Stripe Checkout Session mutation
 */
export const useCreateCheckoutSessionMutation = () => {
  return useMutation({
    mutationFn: async (sessionData) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.CREATE_CHECKOUT_SESSION, sessionData);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onError: (error) => {
      console.error('Create checkout session error:', error);
      toast.error(error.response?.data?.error || 'Failed to create checkout session');
    },
  });
};

/**
 * Create Stripe Connected Account mutation
 * Handles both creating new accounts and resuming incomplete onboarding
 */
export const useCreateStripeAccountMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data = {}) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.CREATE_STRIPE_ACCOUNT, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate user query to refresh stripe status
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Redirect to Stripe onboarding
      if (data.account_link_url) {
        window.location.href = data.account_link_url;
      }
      
      if (data.is_resuming) {
        toast.success('Resuming Stripe onboarding...');
      } else {
        toast.success('Stripe account created! Redirecting to onboarding...');
      }
    },
    onError: (error) => {
      console.error('Create Stripe account error:', error);
      toast.error(error.response?.data?.error || 'Failed to create Stripe account');
    },
  });
};

/**
 * Resume Stripe onboarding mutation
 * Used when user has incomplete Stripe account setup
 */
export const useResumeStripeOnboardingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data = {}) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.STRIPE_RESUME_ONBOARDING, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe onboarding
      if (data.account_link_url) {
        window.location.href = data.account_link_url;
      }
      toast.success('Redirecting to complete Stripe setup...');
    },
    onError: (error) => {
      console.error('Resume Stripe onboarding error:', error);
      // If account was deleted, invalidate user data
      if (error.response?.data?.account_deleted) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
      toast.error(error.response?.data?.error || 'Failed to resume onboarding');
    },
  });
};

/**
 * Add Delivery Address mutation
 */
export const useAddDeliveryAddressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData) => {
      const response = await apiMethods.post(ENDPOINTS.SHOP.ADD_DELIVERY_ADDRESS, addressData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkoutPreview'] });
      toast.success('Delivery address saved!');
    },
    onError: (error) => {
      console.error('Add address error:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
    },
  });
};
