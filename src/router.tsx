import { QueryCache, QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { NotFound, PendingPage, RouteError } from '@/components/route-states'
import { ApiError } from '@/lib/api/errors'
import { hasSession } from '@/lib/auth/session'
import { routeTree } from './routeTree.gen'

export function createAppRouter() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // The session ended (refresh failed): re-run guards, which send the person to sign in.
        if (error instanceof ApiError && error.status === 401 && !hasSession()) {
          void router.invalidate()
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Client errors won't fix themselves; retry only network and 5xx.
        retry: (failureCount, error) =>
          failureCount < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    // Router loaders only warm the Query cache; Query decides freshness.
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingPage,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  })

  return { router, queryClient }
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>['router']
  }
}
