import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 * 
 * Global configuration for React Query including:
 * - Cache timing strategies
 * - Retry logic
 * - Refetch behavior
 * - Error handling
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data stays fresh before refetch (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // How long inactive data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000, // formerly cacheTime
      
      // Retry failed requests twice with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      
      // Show stale data while refetching
      keepPreviousData: true,
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
