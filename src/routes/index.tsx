import { createFileRoute, redirect } from '@tanstack/react-router'
import { homePath } from '@/features/auth/api'
import { loadViewer } from '@/features/auth/guards'

/** Sends everyone where they belong: their home when signed in, else staff sign-in. */
export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const viewer = await loadViewer(context.queryClient)
    throw viewer ? redirect({ href: homePath(viewer) }) : redirect({ to: '/login' })
  },
})
