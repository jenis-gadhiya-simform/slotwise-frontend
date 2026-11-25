import { createFileRoute, Outlet } from '@tanstack/react-router'
import { KeyRoundIcon, UserRoundIcon } from 'lucide-react'
import { Logo } from '@/components/brand'
import { AppShell, NavGroup, SidebarNavLink } from '@/components/layout/app-shell'
import { requireCustomer } from '@/features/auth/guards'
import { useCustomer } from '@/features/auth/use-customer'

/** A customer's own account (F02). */
export const Route = createFileRoute('/account')({
  beforeLoad: async (args) => ({ viewer: await requireCustomer(args) }),
  head: () => ({ meta: [{ title: 'Your account · SlotWise' }] }),
  component: AccountLayout,
})

function AccountLayout() {
  const viewer = useCustomer()
  const name = viewer.email.split('@')[0] ?? viewer.email
  return (
    <AppShell
      header={
        <div className="flex h-12 items-center px-2">
          <Logo />
        </div>
      }
      user={{ name, email: viewer.email, subtitle: 'Customer' }}
      signOutTo="/customer/login"
      nav={
        <NavGroup label="Account">
          <SidebarNavLink to="/account" activeOptions={{ exact: true }} icon={UserRoundIcon}>
            Overview
          </SidebarNavLink>
          <SidebarNavLink to="/account/sign-in-methods" icon={KeyRoundIcon}>
            Sign-in methods
          </SidebarNavLink>
        </NavGroup>
      }
    >
      <Outlet />
    </AppShell>
  )
}
