"use client";

// TODO: wire with TanStack Query v5 when installed
// import { useInfiniteQuery } from "@tanstack/react-query";

export function useInfiniteDeals(_filters?: Record<string, unknown>) {
  // placeholder — real implementation in M6
  return {
    deals: [],
    isLoading: false,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}
