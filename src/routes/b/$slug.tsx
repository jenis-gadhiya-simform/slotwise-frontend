import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { CalendarClockIcon, MapPinIcon, PhoneIcon, StoreIcon } from 'lucide-react'
import { Logo } from '@/components/brand'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { meQueryOptions } from '@/features/auth/api'
import { publicBusinessQueryOptions } from '@/features/business/api'
import { isApiError } from '@/lib/api/errors'
import { hasSession, restoreSession } from '@/lib/auth/session'
import { formatPhone, initials } from '@/lib/format'

/** A business's public booking page (F01). No sign-in needed. */
export const Route = createFileRoute('/b/$slug')({
  loader: async ({ context, params }) => {
    try {
      // In parallel: is a customer signed in (for the header)?
      const [business] = await Promise.all([
        context.queryClient.ensureQueryData(publicBusinessQueryOptions(params.slug)),
        restoreSession(),
      ])
      return business
    } catch (error) {
      if (isApiError(error) && (error.status === 404 || error.status === 400)) throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.name} · Book online` : 'SlotWise' }],
  }),
  component: PublicBusinessPage,
  notFoundComponent: () => (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon />
        </EmptyMedia>
        <EmptyTitle>Business not found</EmptyTitle>
        <EmptyDescription>Check the link, or ask the business for their booking page.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
})

function PublicBusinessPage() {
  const { slug } = Route.useParams()
  const { data: business } = useSuspenseQuery(publicBusinessQueryOptions(slug))
  const location = [business.address, business.city].filter(Boolean).join(', ')

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Logo />
          <CustomerNav slug={slug} />
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-4" /> {location}
              </span>
            ) : null}
            {business.phone ? (
              <a href={`tel:${business.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <PhoneIcon className="size-4" /> {formatPhone(business.phone)}
              </a>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our team</CardTitle>
            <CardDescription>The people you can book with.</CardDescription>
          </CardHeader>
          <CardContent>
            {business.staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is taking bookings yet.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {business.staff.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar>
                      <AvatarFallback>{initials(member.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">{member.displayName}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <CalendarClockIcon className="size-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium">Online booking is coming soon</p>
              <p className="text-muted-foreground">
                Services and available times will appear here. Until then, call {business.name} to book.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/** Sign-in link, or the signed-in customer's account link. */
function CustomerNav({ slug }: { slug: string }) {
  const { data: viewer } = useQuery({ ...meQueryOptions(), enabled: hasSession(), retry: false })

  if (viewer?.kind === 'customer') {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link to="/account">{viewer.email}</Link>
      </Button>
    )
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/customer/login" search={{ tenant: slug }}>
        Sign in
      </Link>
    </Button>
  )
}
