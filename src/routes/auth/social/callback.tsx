import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { homePath, meQueryOptions } from '@/features/auth/api'
import { ApiError, ErrorCode, errorMessage } from '@/lib/api/errors'
import { refreshSession } from '@/lib/auth/session'
import { publicPagePath } from '@/lib/format'
import { safeRedirectPath } from '@/lib/validation'

/**
 * Where Google / Microsoft sign-in lands. The API already set the refresh
 * cookie (no token is ever in the URL); exchange it for an access token.
 */
export const Route = createFileRoute('/auth/social/callback')({
  validateSearch: z.object({
    redirectTo: z.string().optional().catch(undefined),
    tenant: z.string().optional().catch(undefined),
    error: z.string().optional().catch(undefined),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    if (deps.error) throw new ApiError(400, deps.error, 'Social sign-in failed')
    if (!(await refreshSession())) {
      throw new ApiError(401, ErrorCode.SocialSignInFailed, 'Social sign-in failed')
    }
    context.queryClient.clear()
    const viewer = await context.queryClient.fetchQuery(meQueryOptions())
    throw redirect({
      href:
        safeRedirectPath(deps.redirectTo) ??
        (deps.tenant ? publicPagePath(deps.tenant) : homePath(viewer)),
      replace: true,
    })
  },
  pendingMs: 0,
  pendingComponent: () => (
    <AuthLayout title="Signing you in…">
      <div className="flex justify-center py-4">
        <Spinner className="size-6" />
      </div>
    </AuthLayout>
  ),
  errorComponent: function SocialCallbackError({ error }) {
    const { tenant } = Route.useSearch()
    return (
      <AuthLayout title="Couldn’t sign you in" description={errorMessage(error)}>
        <Button asChild className="w-full">
          <Link to="/customer/login" search={{ tenant }}>
            Back to sign in
          </Link>
        </Button>
      </AuthLayout>
    )
  },
})
