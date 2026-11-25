import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { meQueryOptions } from '@/features/auth/api'
import type { Membership, StaffViewer } from '@/lib/types'

const LAST_BUSINESS_KEY = 'slotwise:last-business'

/**
 * The business in the URL (`/app/$slug/...`) and the viewer's role in it.
 * Reads the live `/me` cache, so renames and role changes show up at once.
 * Only for routes under `/app/$slug`, whose guard guarantees the membership.
 */
export function useMembership(): { membership: Membership; viewer: StaffViewer } {
  const { slug } = useParams({ from: '/app/$slug' })
  const { data } = useSuspenseQuery(meQueryOptions())
  const viewer = data as StaffViewer
  const membership = viewer.memberships.find((m) => m.tenantSlug === slug)
  if (!membership) throw new Error(`Not a member of ${slug}`)
  return { membership, viewer }
}

export function rememberBusiness(slug: string): void {
  try {
    localStorage.setItem(LAST_BUSINESS_KEY, slug)
  } catch {
    // Storage unavailable (private mode): not remembering is fine.
  }
}

export function lastBusiness(): string | null {
  try {
    return localStorage.getItem(LAST_BUSINESS_KEY)
  } catch {
    return null
  }
}
