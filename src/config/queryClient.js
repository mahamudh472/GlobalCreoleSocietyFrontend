import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 * 
 * Global configuration for React Query including:
 * - Cache timing strategies
 * - Retry logic
 * - Refetch behavior
 * - Error handling
 * 
 * IMPORTANT: Auth-sensitive queries should have shorter staleTime
 * to prevent stale user data after account switching
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduced staleTime to prevent stale data issues (2 minutes)
      staleTime: 2 * 60 * 1000,
      
      // How long inactive data stays in cache (5 minutes)
      gcTime: 5 * 60 * 1000, // formerly cacheTime
      
      // Retry failed requests twice with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data (CRITICAL for auth changes)
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Always refetch on mount to ensure fresh data after navigation
      refetchOnMount: true,
      
      // Don't keep previous data during refetch - prevents showing stale user data
      keepPreviousData: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Global mutation error handler
      onError: (error) => {
        console.error('Mutation error:', error);
        // You can add global error toast here if needed
      },
    },
  },
});

export default queryClient;
