import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

export interface RouterContext {
  queryClient: QueryClient
}

const Devtools = import.meta.env.DEV
  ? lazy(() => import('@/components/devtools'))
  : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: 'SlotWise' }] }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
