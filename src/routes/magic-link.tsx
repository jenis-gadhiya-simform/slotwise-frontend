import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { homePath, startSession, verifyMagicLink } from '@/features/auth/api'
import { LinkProblem } from '@/features/auth/components/link-problem'
import { ApiError, ErrorCode } from '@/lib/api/errors'
import { publicPagePath } from '@/lib/format'

/**
 * A customer's emailed sign-in link: `/magic-link?token=…&tenant=…`. The
 * token is single use, so it is spent in the loader (runs once per
 * navigation), never in an effect that StrictMode would run twice.
 */
export const Route = createFileRoute('/magic-link')({
  validateSearch: z.object({
    token: z.string().optional().catch(undefined),
    tenant: z.string().optional().catch(undefined),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    if (!deps.token) throw new ApiError(410, ErrorCode.LinkExpired, 'Missing link token')
    const viewer = await startSession(context.queryClient, await verifyMagicLink(deps.token))
    throw redirect({ href: deps.tenant ? publicPagePath(deps.tenant) : homePath(viewer), replace: true })
  },
  head: () => ({ meta: [{ title: 'Signing in · SlotWise' }] }),
  pendingMs: 0,
  pendingComponent: () => (
    <AuthLayout title="Signing you in…">
      <div className="flex justify-center py-4">
        <Spinner className="size-6" />
      </div>
    </AuthLayout>
  ),
  errorComponent: function MagicLinkError({ error }) {
    const { tenant } = Route.useSearch()
    return (
      <LinkProblem error={error}>
        <Button asChild>
          <Link to="/customer/login" search={{ tenant }}>
            Send me a new link
          </Link>
        </Button>
      </LinkProblem>
    )
  },
})
