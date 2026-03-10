import { QueryClient } from "@tanstack/react-query";

export const API_QUERY_STALE_TIME = 5 * 60 * 1000;
export const API_QUERY_GC_TIME = 30 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: API_QUERY_STALE_TIME,
      gcTime: API_QUERY_GC_TIME,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});
