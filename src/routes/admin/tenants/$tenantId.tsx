import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon, ExternalLinkIcon, MailIcon, UserRoundPenIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/page-header'
import { AccountStatusBadge, TenantStatusBadge } from '@/components/status-badges'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  tenantDetailQueryOptions,
  useReplacePendingOwner,
  useResendOwnerSetup,
} from '@/features/admin/api'
import { errorMessage, isApiError } from '@/lib/api/errors'
import { formatDate, formatPhone, initials } from '@/lib/format'
import type { TenantOwner } from '@/lib/types'
import { emailSchema, personNameSchema } from '@/lib/validation'

export const Route = createFileRoute('/admin/tenants/$tenantId')({
  params: {
    parse: ({ tenantId }) => ({ tenantId: z.uuid().parse(tenantId) }),
  },
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(tenantDetailQueryOptions(params.tenantId))
    } catch (error) {
      if (isApiError(error) && error.status === 404) throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.tenant.name ?? 'Business'} · SlotWise admin` }],
  }),
  component: TenantDetailPage,
})

function TenantDetailPage() {
  const { tenantId } = Route.useParams()
  const { data } = useSuspenseQuery(tenantDetailQueryOptions(tenantId))
  const { tenant, owner } = data

  const details: Array<[string, string]> = [
    ['Booking page', `/b/${tenant.slug}`],
    ['Phone', formatPhone(tenant.phone) || '—'],
    ['City', tenant.city ?? '—'],
    ['Address', tenant.address ?? '—'],
    ['Created', formatDate(tenant.createdAt)],
  ]

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/admin/tenants">
          <ArrowLeftIcon />
          Businesses
        </Link>
      </Button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {tenant.name}
            <TenantStatusBadge status={tenant.status} />
          </span>
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/b/$slug" params={{ slug: tenant.slug }} target="_blank">
              <ExternalLinkIcon />
              Public page
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <OwnerCard tenantId={tenant.id} owner={owner} />
      </div>
    </>
  )
}

function OwnerCard({ tenantId, owner }: { tenantId: string; owner: TenantOwner | null }) {
  const resend = useResendOwnerSetup(tenantId)
  const pending = owner?.status === 'PENDING_SETUP'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner</CardTitle>
        <CardDescription>
          {pending
            ? 'Hasn’t set a password yet. Their invite link lasts 72 hours.'
            : 'Ownership can only be transferred by the Owner.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {owner ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{initials(owner.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight">
              <span className="font-medium">{owner.name}</span>
              <span className="text-sm text-muted-foreground">{owner.email}</span>
            </div>
            <AccountStatusBadge status={owner.status} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This business has no Owner.</p>
        )}
      </CardContent>
      {pending ? (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={resend.isPending}
            onClick={() =>
              resend.mutate(undefined, {
                onSuccess: () => toast.success(`New set-password link sent to ${owner.email}.`),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            {resend.isPending ? <Spinner /> : <MailIcon />}
            Resend invite
          </Button>
          <ReplaceOwnerDialog tenantId={tenantId} current={owner} />
        </CardFooter>
      ) : null}
    </Card>
  )
}

function ReplaceOwnerDialog({ tenantId, current }: { tenantId: string; current: TenantOwner }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserRoundPenIcon />
          Replace owner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace the owner</DialogTitle>
          <DialogDescription>
            For a mistyped email. {current.name}’s invite stops working and the new Owner gets their own.
          </DialogDescription>
        </DialogHeader>
        <ReplaceOwnerForm tenantId={tenantId} current={current} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

const ownerSchema = z.object({ name: personNameSchema, email: emailSchema })

function ReplaceOwnerForm({
  tenantId,
  current,
  onDone,
}: {
  tenantId: string
  current: TenantOwner
  onDone: () => void
}) {
  const replace = useReplacePendingOwner(tenantId)
  const form = useAppForm({
    defaultValues: { name: current.name, email: current.email },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: ownerSchema },
    onSubmit: async ({ value }) => {
      try {
        const { owner } = await replace.mutateAsync({ name: value.name.trim(), email: value.email.trim() })
        toast.success(`${owner.name} is now the Owner and was emailed an invite.`)
        onDone()
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="name">{(field) => <field.TextField label="Full name" />}</form.AppField>
        <form.AppField name="email">
          {(field) => <field.TextField label="Email" type="email" autoFocus />}
        </form.AppField>
        <FormError error={replace.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>Replace owner</form.SubmitButton>
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
