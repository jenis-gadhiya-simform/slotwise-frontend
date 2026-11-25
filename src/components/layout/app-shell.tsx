import { createLink, useNavigate } from '@tanstack/react-router'
import { ChevronsUpDownIcon, LogOutIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useLogout } from '@/features/auth/api'
import { initials } from '@/lib/format'

interface NavLinkProps extends React.ComponentProps<'a'> {
  icon: LucideIcon
}

/** A sidebar item that is a type-safe router link; active state comes from the router. */
function SidebarNavLinkBase({ icon: Icon, children, ...props }: NavLinkProps) {
  const isActive = (props as { 'data-status'?: string })['data-status'] === 'active'
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <a {...props}>
          <Icon />
          <span>{children}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export const SidebarNavLink = createLink(SidebarNavLinkBase)

interface AppShellProps {
  /** Top of the sidebar: logo or business switcher. */
  header: ReactNode
  /** Navigation groups. */
  nav: ReactNode
  user: { name: string; email: string; subtitle?: string }
  /** Where to land after signing out. */
  signOutTo: '/login' | '/customer/login'
  children: ReactNode
}

export function AppShell({ header, nav, user, signOutTo, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>{header}</SidebarHeader>
        <SidebarContent>{nav}</SidebarContent>
        <SidebarFooter>
          <UserMenu user={user} signOutTo={signOutTo} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function NavGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function UserMenu({ user, signOutTo }: Pick<AppShellProps, 'user' | 'signOutTo'>) {
  const navigate = useNavigate()
  const logout = useLogout()

  const signOut = () =>
    logout.mutate(undefined, {
      onSettled: () => void navigate({ to: signOutTo, replace: true }),
    })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.subtitle ?? user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="min-w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="grid text-sm leading-tight">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} disabled={logout.isPending}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
