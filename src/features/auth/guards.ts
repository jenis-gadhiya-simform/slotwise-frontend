import type { QueryClient } from '@tanstack/react-query'
import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { isApiError } from '@/lib/api/errors'
import { clearSession, restoreSession } from '@/lib/auth/session'
import type { CustomerViewer, StaffViewer, Viewer } from '@/lib/types'
import { homePath, meQueryOptions } from './api'

interface GuardArgs {
  context: { queryClient: QueryClient }
  location: ParsedLocation
}

/** The signed-in account, or null. Restores the session from the refresh cookie once per load. */
export async function loadViewer(queryClient: QueryClient): Promise<Viewer | null> {
  if (!(await restoreSession())) return null
  try {
    return await queryClient.ensureQueryData(meQueryOptions())
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      clearSession()
      queryClient.clear()
      return null
    }
    throw error
  }
}

/** Staff-side pages (business members). Platform admins go to /admin. */
export async function requireStaff({ context, location }: GuardArgs): Promise<StaffViewer> {
  const viewer = await loadViewer(context.queryClient)
  if (!viewer) throw redirect({ to: '/login', search: { redirect: location.href } })
  if (viewer.kind !== 'staff' || viewer.isPlatformAdmin) throw redirect({ href: homePath(viewer) })
  return viewer
}

export async function requirePlatformAdmin({ context, location }: GuardArgs): Promise<StaffViewer> {
  const viewer = await loadViewer(context.queryClient)
  if (!viewer) throw redirect({ to: '/login', search: { redirect: location.href } })
  if (viewer.kind !== 'staff' || !viewer.isPlatformAdmin) throw redirect({ href: homePath(viewer) })
  return viewer
}

export async function requireCustomer({ context, location }: GuardArgs): Promise<CustomerViewer> {
  const viewer = await loadViewer(context.queryClient)
  if (!viewer) {
    throw redirect({ to: '/customer/login', search: { redirectTo: location.href } })
  }
  if (viewer.kind !== 'customer') throw redirect({ href: homePath(viewer) })
  return viewer
}

/** Sign-in pages: someone already signed in goes straight home. */
export async function redirectIfSignedIn({ context }: Pick<GuardArgs, 'context'>) {
  const viewer = await loadViewer(context.queryClient)
  if (viewer) throw redirect({ href: homePath(viewer) })
}
