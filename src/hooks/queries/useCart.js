import { useQuery } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';

/**
 * Fetch user's shopping cart
 * @returns {UseQueryResult}
 */
export const useCart = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.cart.items(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.CART);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
};

/**
 * Fetch checkout preview (cart summary with totals)
 * @returns {UseQueryResult}
 */
export const useCheckoutPreview = (options = {}) => {
  return useQuery({
    queryKey: ['checkoutPreview'],
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.CHECKOUT_PREVIEW);
      return response.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    ...options,
  });
};

/**
 * Fetch user's orders
 * @returns {UseQueryResult}
 */
export const useOrders = (options = {}) => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.ORDERS);
      const ordersData = response.data.results || response.data;
      return Array.isArray(ordersData) ? ordersData : [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
};

/**
 * Fetch single order details
 * @param {string|number} orderId - Order ID
 * @returns {UseQueryResult}
 */
export const useOrderDetail = (orderId, options = {}) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.ORDER_DETAIL(orderId));
      return response.data;
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Fetch Stripe account status for the current user
 * @returns {UseQueryResult}
 */
export const useStripeAccountStatus = (options = {}) => {
  return useQuery({
    queryKey: ['stripeAccountStatus'],
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.STRIPE_ACCOUNT_STATUS);
      return response.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minute - refresh frequently to catch status updates
    retry: 1,
    ...options,
  });
};
