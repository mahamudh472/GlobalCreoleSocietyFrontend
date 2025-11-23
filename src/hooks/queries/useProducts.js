import { useQuery } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';

/**
 * Fetch all products with optional filters
 * @param {Object} filters - Search and filter options
 * @returns {UseQueryResult}
 */
export const useProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      
      const url = params.toString() 
        ? `${ENDPOINTS.SHOP.PRODUCTS}?${params.toString()}`
        : ENDPOINTS.SHOP.PRODUCTS;
      
      const response = await apiMethods.get(url);
      const productsData = response.data.results || response.data;
      return Array.isArray(productsData) ? productsData : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Fetch current user's products
 * @returns {UseQueryResult}
 */
export const useMyProducts = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.myProducts(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.MY_PRODUCTS);
      const productsData = response.data.results || response.data;
      return Array.isArray(productsData) ? productsData : [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
};

/**
 * Fetch a single product by ID
 * @param {string|number} productId - Product ID
 * @returns {UseQueryResult}
 */
export const useProductDetail = (productId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.PRODUCT_DETAIL(productId));
      return response.data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Fetch product categories
 * @returns {UseQueryResult}
 */
export const useProductCategories = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn: async () => {
      const response = await apiMethods.get(ENDPOINTS.SHOP.CATEGORIES);
      // Handle both array and paginated response
      const categoriesData = response.data.results || response.data;
      return Array.isArray(categoriesData) ? categoriesData : [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - categories don't change often
    ...options,
  });
};
