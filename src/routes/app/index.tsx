import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { StoreIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useLogout } from '@/features/auth/api'
import { lastBusiness } from '@/features/business/use-membership'

/** Opens the business used last, or the first one; explains when there is none. */
export const Route = createFileRoute('/app/')({
  beforeLoad: ({ context }) => {
    const { memberships } = context.viewer
    const remembered = lastBusiness()
    const target =
      memberships.find((m) => m.tenantSlug === remembered) ??
      memberships.find((m) => m.tenantStatus === 'ACTIVE') ??
      memberships[0]
    if (target) {
      throw redirect({ to: '/app/$slug', params: { slug: target.tenantSlug }, replace: true })
    }
  },
  component: NoBusiness,
})

function NoBusiness() {
  const navigate = useNavigate()
  const logout = useLogout()
  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon />
        </EmptyMedia>
        <EmptyTitle>You’re not part of a business yet</EmptyTitle>
        <EmptyDescription>
          When a business owner or manager adds you to their team, it will show up here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/login' }) })}
        >
          Sign out
        </Button>
      </EmptyContent>
    </Empty>
  )
}
