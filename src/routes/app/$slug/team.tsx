import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { UsersIcon } from 'lucide-react'
import { z } from 'zod'
import { PageHeader } from '@/components/page-header'
import { AccountStatusBadge, RoleBadge } from '@/components/status-badges'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMembership } from '@/features/business/use-membership'
import { membersQueryOptions } from '@/features/team/api'
import { AddMemberDialog } from '@/features/team/components/add-member-dialog'
import { MemberActions } from '@/features/team/components/member-actions'
import { formatDate, initials } from '@/lib/format'
import { can, canManageRole, ROLE_LABELS } from '@/lib/permissions'
import { MemberRole, MemberStatus } from '@/lib/types'

const searchSchema = z.object({
  status: z.enum(MemberStatus).optional().catch(undefined),
  role: z.enum(MemberRole).optional().catch(undefined),
})

/** Team members (Owner, Manager): `/members`. */
export const Route = createFileRoute('/app/$slug/team')({
  validateSearch: searchSchema,
  beforeLoad: ({ context, params }) => {
    if (!can.manageTeam(context.membership.role)) throw redirect({ to: '/app/$slug', params })
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient, membership }, deps }) =>
    queryClient.ensureQueryData(membersQueryOptions(membership.tenantId, deps)),
  head: () => ({ meta: [{ title: 'Team · SlotWise' }] }),
  component: TeamPage,
})

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: MemberStatus.ACTIVE, label: 'Active' },
  { value: MemberStatus.PENDING_SETUP, label: 'Invite pending' },
  { value: MemberStatus.REMOVED, label: 'Removed' },
] as const

function TeamPage() {
  const filters = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { membership, viewer } = useMembership()
  const { data: members } = useSuspenseQuery(membersQueryOptions(membership.tenantId, filters))

  const setFilter = (next: Partial<z.infer<typeof searchSchema>>) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })

  return (
    <>
      <PageHeader
        title="Team"
        description="Who works here, what they can do, and who takes bookings."
        actions={<AddMemberDialog tenantId={membership.tenantId} actorRole={membership.role} />}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filters.status ?? 'all'}
          onValueChange={(value) =>
            setFilter({ status: value === 'all' ? undefined : (value as MemberStatus) })
          }
        >
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select
          value={filters.role ?? 'all'}
          onValueChange={(value) => setFilter({ role: value === 'all' ? undefined : (value as MemberRole) })}
        >
          <SelectTrigger className="w-40" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {Object.values(MemberRole).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0">
        {members.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No one here</EmptyTitle>
              <EmptyDescription>
                {filters.status || filters.role ? (
                  <Link from={Route.fullPath} search={{}} className="underline underline-offset-4">
                    Clear filters
                  </Link>
                ) : (
                  'Add your first team member to get started.'
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isYou = member.userId === viewer.id
                const manageable =
                  !isYou && member.status !== 'REMOVED' && canManageRole(membership.role, member.role)
                return (
                  <TableRow key={member.id} className={member.status === 'REMOVED' ? 'opacity-60' : undefined}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>{initials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid leading-tight">
                          <span className="font-medium">
                            {member.name}
                            {isYou ? (
                              <Badge variant="secondary" className="ml-2">
                                You
                              </Badge>
                            ) : null}
                          </span>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.bookable ? 'Bookable' : '—'}</TableCell>
                    <TableCell>
                      <AccountStatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      {manageable ? (
                        <MemberActions member={member} tenantId={membership.tenantId} actorRole={membership.role} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
