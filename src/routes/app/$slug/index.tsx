import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2Icon, CircleIcon, ExternalLinkIcon, MapPinIcon, PhoneIcon } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { PageHeader } from '@/components/page-header'
import { RoleBadge } from '@/components/status-badges'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { currentBusinessQueryOptions } from '@/features/business/api'
import { useMembership } from '@/features/business/use-membership'
import { calendarsQueryOptions, membersQueryOptions } from '@/features/team/api'
import { formatPhone, initials, publicPagePath } from '@/lib/format'
import { can, ROLE_DESCRIPTIONS } from '@/lib/permissions'
import type { Tenant } from '@/lib/types'

export const Route = createFileRoute('/app/$slug/')({
  loader: ({ context: { queryClient, membership } }) =>
    Promise.all([
      queryClient.ensureQueryData(currentBusinessQueryOptions(membership.tenantId)),
      queryClient.ensureQueryData(calendarsQueryOptions(membership.tenantId, true)),
    ]),
  component: OverviewPage,
})

function OverviewPage() {
  const { membership, viewer } = useMembership()
  const { tenantId, tenantSlug, role } = membership
  const { data: business } = useSuspenseQuery(currentBusinessQueryOptions(tenantId))
  const { data: calendars } = useSuspenseQuery(calendarsQueryOptions(tenantId, true))
  const publicUrl = `${window.location.origin}${publicPagePath(tenantSlug)}`
  const firstName = viewer.name.split(' ')[0]

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} description={`Here’s ${business.name} at a glance.`} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{business.name}</CardTitle>
            <CardDescription>Your business profile, as customers see it.</CardDescription>
            {can.editBusiness(role) ? (
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link to="/app/$slug/settings" params={{ slug: tenantSlug }}>
                    Edit
                  </Link>
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-2 text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <PhoneIcon className="size-4" />
                {business.phone ? formatPhone(business.phone) : 'No phone number yet'}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPinIcon className="size-4" />
                {[business.address, business.city].filter(Boolean).join(', ') || 'No address yet'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{publicUrl}</span>
              <CopyButton value={publicUrl} />
              <Button asChild variant="ghost" size="sm">
                <Link to="/b/$slug" params={{ slug: tenantSlug }} target="_blank">
                  <ExternalLinkIcon />
                  Open
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your role</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <RoleBadge role={role} />
            <p className="text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Calendars</CardTitle>
            <CardDescription>
              {calendars.length === 1 ? '1 person takes bookings.' : `${calendars.length} people take bookings.`}
            </CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/$slug/calendars" params={{ slug: tenantSlug }}>
                  View all
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {calendars.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is bookable yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {calendars.slice(0, 8).map((calendar) => (
                  <li key={calendar.id} className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">{initials(calendar.displayName)}</AvatarFallback>
                    </Avatar>
                    {calendar.displayName}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {can.manageTeam(role) ? <GettingStarted business={business} slug={tenantSlug} /> : null}
      </div>
    </>
  )
}

function GettingStarted({ business, slug }: { business: Tenant; slug: string }) {
  const { data: members } = useQuery(membersQueryOptions(business.id, {}))
  const steps = [
    {
      label: 'Complete your business profile',
      done: Boolean(business.phone && business.city),
      link: <Link to="/app/$slug/settings" params={{ slug }}>Add details</Link>,
    },
    {
      label: 'Invite your team',
      done: (members?.length ?? 0) > 1,
      link: <Link to="/app/$slug/team" params={{ slug }}>Add members</Link>,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 text-sm">
          {steps.map((step) => (
            <li key={step.label} className="flex items-start gap-2">
              {step.done ? (
                <CheckCircle2Icon className="mt-0.5 size-4 text-emerald-600" />
              ) : (
                <CircleIcon className="mt-0.5 size-4 text-muted-foreground" />
              )}
              <div className="grid">
                <span className={step.done ? 'text-muted-foreground line-through' : ''}>{step.label}</span>
                {!step.done ? (
                  <span className="text-primary underline-offset-4 hover:underline">{step.link}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
