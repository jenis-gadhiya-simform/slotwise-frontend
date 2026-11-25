import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarClockIcon, CheckCircle2Icon, CircleIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PROVIDER_LABELS } from '@/features/auth/providers'
import { useCustomer } from '@/features/auth/use-customer'

export const Route = createFileRoute('/account/')({
  component: AccountOverview,
})

function AccountOverview() {
  const viewer = useCustomer()
  const methods = [
    { label: 'Email link', enabled: true },
    { label: 'Password', enabled: viewer.hasPassword },
    ...viewer.identities.map((provider) => ({ label: PROVIDER_LABELS[provider], enabled: true })),
  ]

  return (
    <>
      <PageHeader title="Your account" description="Your bookings and how you sign in." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="flex items-center gap-2 font-medium">
              {viewer.email}
              {viewer.emailVerified ? <Badge variant="secondary">Verified</Badge> : null}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign-in methods</CardTitle>
            <CardDescription>Ways you can get into your account.</CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link to="/account/sign-in-methods">Manage</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm">
              {methods.map((method) => (
                <li key={method.label} className="flex items-center gap-2">
                  {method.enabled ? (
                    <CheckCircle2Icon className="size-4 text-emerald-600" />
                  ) : (
                    <CircleIcon className="size-4 text-muted-foreground" />
                  )}
                  <span className={method.enabled ? undefined : 'text-muted-foreground'}>{method.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClockIcon />
              </EmptyMedia>
              <EmptyTitle>No bookings yet</EmptyTitle>
              <EmptyDescription>Appointments you book will show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      </div>
    </>
  )
}
