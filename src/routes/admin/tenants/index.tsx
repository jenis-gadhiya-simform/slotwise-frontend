import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Building2Icon } from 'lucide-react'
import { z } from 'zod'
import { PageHeader } from '@/components/page-header'
import { TenantStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { tenantsInfiniteQueryOptions } from '@/features/admin/api'
import { CreateTenantDialog } from '@/features/admin/components/create-tenant-dialog'
import { formatDate } from '@/lib/format'
import { TenantStatus } from '@/lib/types'

export const Route = createFileRoute('/admin/tenants/')({
  validateSearch: z.object({ status: z.enum(TenantStatus).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(tenantsInfiniteQueryOptions(deps.status)),
  head: () => ({ meta: [{ title: 'Businesses · SlotWise admin' }] }),
  component: TenantsPage,
})

function TenantsPage() {
  const { status } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    tenantsInfiniteQueryOptions(status),
  )
  const tenants = data.pages.flatMap((page) => page.items)

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Every business on SlotWise, newest first."
        actions={<CreateTenantDialog />}
      />

      <Tabs
        value={status ?? 'all'}
        onValueChange={(value) =>
          void navigate({ search: { status: value === 'all' ? undefined : (value as TenantStatus) }, replace: true })
        }
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="SUSPENDED">Suspended</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="py-0">
        {tenants.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2Icon />
              </EmptyMedia>
              <EmptyTitle>No businesses yet</EmptyTitle>
              <EmptyDescription>
                {status ? 'None match this filter.' : 'Create the first business and invite its Owner.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Business</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className="relative">
                  <TableCell className="pl-4">
                    <div className="grid leading-tight">
                      {/* The link's ::after covers the row, so the whole row is clickable. */}
                      <Link
                        to="/admin/tenants/$tenantId"
                        params={{ tenantId: tenant.id }}
                        className="font-medium after:absolute after:inset-0 hover:underline"
                      >
                        {tenant.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">/b/{tenant.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.city ?? '—'}</TableCell>
                  <TableCell>
                    <TenantStatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{formatDate(tenant.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <Spinner /> : null}
            Load more
          </Button>
        </div>
      ) : null}
    </>
  )
}
