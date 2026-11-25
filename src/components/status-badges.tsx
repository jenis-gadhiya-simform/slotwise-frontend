import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/permissions'
import type { MemberRole, MemberStatus, TenantStatus, UserStatus } from '@/lib/types'

export function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <Badge variant={role === 'OWNER' ? 'default' : 'secondary'}>{ROLE_LABELS[role]}</Badge>
  )
}

const ACCOUNT_STATUS: Record<
  MemberStatus | UserStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>['variant']; dot: string }
> = {
  ACTIVE: { label: 'Active', variant: 'outline', dot: 'bg-emerald-500' },
  PENDING_SETUP: { label: 'Invite pending', variant: 'outline', dot: 'bg-amber-500' },
  REMOVED: { label: 'Removed', variant: 'outline', dot: 'bg-muted-foreground/50' },
  DISABLED: { label: 'Disabled', variant: 'outline', dot: 'bg-muted-foreground/50' },
}

/** A member's or user's setup status. */
export function AccountStatusBadge({ status }: { status: MemberStatus | UserStatus }) {
  const { label, variant, dot } = ACCOUNT_STATUS[status]
  return (
    <Badge variant={variant}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </Badge>
  )
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return status === 'ACTIVE' ? (
    <Badge variant="outline">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Active
    </Badge>
  ) : (
    <Badge variant="destructive">Suspended</Badge>
  )
}
