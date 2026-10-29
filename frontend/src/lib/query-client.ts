import { MutationCache, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      // Invalidação automática declarativa de queries via meta
      if (mutation.meta?.invalidates) {
        mutation.meta.invalidates.forEach((queryKey) => {
          void queryClient.invalidateQueries({ queryKey })
        })
      }
    }
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})
