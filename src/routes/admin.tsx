import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Building2Icon } from 'lucide-react'
import { Logo } from '@/components/brand'
import { AppShell, NavGroup, SidebarNavLink } from '@/components/layout/app-shell'
import { requirePlatformAdmin } from '@/features/auth/guards'

/** Platform admin console (F01): create and look after businesses. */
export const Route = createFileRoute('/admin')({
  beforeLoad: async (args) => ({ viewer: await requirePlatformAdmin(args) }),
  head: () => ({ meta: [{ title: 'Admin · SlotWise' }] }),
  component: AdminLayout,
})

function AdminLayout() {
  const { viewer } = Route.useRouteContext()
  return (
    <AppShell
      header={
        <Link to="/admin/tenants" className="flex h-12 items-center gap-2 px-2">
          <Logo />
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
            Admin
          </span>
        </Link>
      }
      user={{ name: viewer.name, email: viewer.email, subtitle: 'Platform admin' }}
      signOutTo="/login"
      nav={
        <NavGroup label="Platform">
          <SidebarNavLink to="/admin/tenants" icon={Building2Icon}>
            Businesses
          </SidebarNavLink>
        </NavGroup>
      }
    >
      <Outlet />
    </AppShell>
  )
}
