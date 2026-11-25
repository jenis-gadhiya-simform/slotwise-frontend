import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldAlertIcon,
  UsersIcon,
} from 'lucide-react'
import { AppShell, NavGroup, SidebarNavLink } from '@/components/layout/app-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { rememberBusiness, useMembership } from '@/features/business/use-membership'
import { initials } from '@/lib/format'
import { can, ROLE_LABELS } from '@/lib/permissions'
import type { Membership } from '@/lib/types'

/** One business, chosen by its slug in the URL; every page below acts in it. */
export const Route = createFileRoute('/app/$slug')({
  beforeLoad: ({ context, params }) => {
    const membership = context.viewer.memberships.find((m) => m.tenantSlug === params.slug)
    if (!membership) throw redirect({ to: '/app', replace: true })
    rememberBusiness(params.slug)
    return { membership }
  },
  head: ({ match }) => ({
    meta: [{ title: `${match.context.membership.tenantName} · SlotWise` }],
  }),
  component: BusinessLayout,
})

function BusinessLayout() {
  const { membership, viewer } = useMembership()
  const slug = membership.tenantSlug

  return (
    <AppShell
      header={<BusinessSwitcher current={membership} memberships={viewer.memberships} />}
      user={{ name: viewer.name, email: viewer.email, subtitle: ROLE_LABELS[membership.role] }}
      signOutTo="/login"
      nav={
        <NavGroup>
          <SidebarNavLink to="/app/$slug" params={{ slug }} activeOptions={{ exact: true }} icon={LayoutDashboardIcon}>
            Overview
          </SidebarNavLink>
          <SidebarNavLink to="/app/$slug/calendars" params={{ slug }} icon={CalendarDaysIcon}>
            Calendars
          </SidebarNavLink>
          {can.manageTeam(membership.role) ? (
            <SidebarNavLink to="/app/$slug/team" params={{ slug }} icon={UsersIcon}>
              Team
            </SidebarNavLink>
          ) : null}
          {can.editBusiness(membership.role) ? (
            <SidebarNavLink to="/app/$slug/settings" params={{ slug }} icon={SettingsIcon}>
              Business settings
            </SidebarNavLink>
          ) : null}
        </NavGroup>
      }
    >
      {membership.tenantStatus === 'SUSPENDED' ? <Suspended name={membership.tenantName} /> : <Outlet />}
    </AppShell>
  )
}

function BusinessSwitcher({ current, memberships }: { current: Membership; memberships: Membership[] }) {
  const navigate = useNavigate()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {initials(current.tenantName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{current.tenantName}</span>
                <span className="truncate text-xs text-muted-foreground">slotwise / {current.tenantSlug}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="min-w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Your businesses</DropdownMenuLabel>
            {memberships.map((m) => (
              <DropdownMenuItem
                key={m.tenantId}
                onSelect={() => void navigate({ to: '/app/$slug', params: { slug: m.tenantSlug } })}
              >
                <div className="grid flex-1 leading-tight">
                  <span>{m.tenantName}</span>
                  <span className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</span>
                </div>
                {m.tenantId === current.tenantId ? <CheckIcon className="size-4" /> : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/b/$slug" params={{ slug: current.tenantSlug }} target="_blank">
                <ExternalLinkIcon />
                View public booking page
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function Suspended({ name }: { name: string }) {
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{name} is suspended</EmptyTitle>
        <EmptyDescription>
          Its booking page is offline and its data can’t be changed. Contact SlotWise support to restore it.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
