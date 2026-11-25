import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  currentBusinessQueryOptions,
  useUpdateBusiness,
  type UpdateBusinessInput,
} from '@/features/business/api'
import { useMembership } from '@/features/business/use-membership'
import { formatPhone, publicPagePath } from '@/lib/format'
import { can } from '@/lib/permissions'
import type { Tenant } from '@/lib/types'
import {
  businessNameSchema,
  emptyToNull,
  optionalPhoneSchema,
  optionalText,
  toE164,
} from '@/lib/validation'

/** Business profile (Owner, Manager): `PATCH /tenants/current`. */
export const Route = createFileRoute('/app/$slug/settings')({
  beforeLoad: ({ context, params }) => {
    if (!can.editBusiness(context.membership.role)) {
      throw redirect({ to: '/app/$slug', params })
    }
  },
  loader: ({ context: { queryClient, membership } }) =>
    queryClient.ensureQueryData(currentBusinessQueryOptions(membership.tenantId)),
  head: () => ({ meta: [{ title: 'Business settings · SlotWise' }] }),
  component: SettingsPage,
})

const businessSchema = z.object({
  name: businessNameSchema,
  phone: optionalPhoneSchema,
  city: optionalText(100),
  address: optionalText(300),
})
type BusinessValues = z.input<typeof businessSchema>

const toFormValues = (tenant: Tenant): BusinessValues => ({
  name: tenant.name,
  phone: tenant.phone ? formatPhone(tenant.phone) : '',
  city: tenant.city ?? '',
  address: tenant.address ?? '',
})

/** Only the fields that changed, in the API's shape ("" clears a field). */
function changes(tenant: Tenant, values: BusinessValues): UpdateBusinessInput {
  const next = {
    name: values.name.trim(),
    phone: values.phone.trim() ? toE164(values.phone) : null,
    city: emptyToNull(values.city),
    address: emptyToNull(values.address),
  }
  return Object.fromEntries(
    Object.entries(next).filter(([key, value]) => tenant[key as keyof typeof next] !== value),
  )
}

function SettingsPage() {
  const { membership } = useMembership()
  const { data: business } = useSuspenseQuery(currentBusinessQueryOptions(membership.tenantId))
  const update = useUpdateBusiness(membership.tenantId)

  const form = useAppForm({
    defaultValues: toFormValues(business),
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: businessSchema },
    onSubmit: async ({ value, formApi }) => {
      const body = changes(business, value)
      if (Object.keys(body).length === 0) {
        toast.info('No changes to save.')
        return
      }
      try {
        const updated = await update.mutateAsync(body)
        formApi.reset(toFormValues(updated))
        toast.success('Business profile saved.')
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <>
      <PageHeader title="Business settings" description="What customers see on your booking page." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>SlotWise works in India, in INR, in your customers’ local time.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitHandler(form)} noValidate>
            <FieldGroup>
              <form.AppField name="name">{(field) => <field.TextField label="Business name" />}</form.AppField>
              <div className="grid gap-2">
                <Label htmlFor="booking-address">Booking page</Label>
                <Input
                  id="booking-address"
                  value={`${window.location.host}${publicPagePath(business.slug)}`}
                  readOnly
                  disabled
                />
                <p className="text-sm text-muted-foreground">The address can’t be changed once created.</p>
              </div>
              <form.AppField name="phone">
                {(field) => (
                  <field.TextField
                    label="Phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="98765 43210"
                    description="An Indian mobile number."
                  />
                )}
              </form.AppField>
              <form.AppField name="city">{(field) => <field.TextField label="City" placeholder="Ahmedabad" />}</form.AppField>
              <form.AppField name="address">
                {(field) => <field.TextareaField label="Address" rows={3} />}
              </form.AppField>
              <FormError error={update.error} />
              <div className="flex justify-end gap-2">
                <form.Subscribe selector={(state) => state.isDirty}>
                  {(isDirty) => (
                    <form.AppForm>
                      <form.SubmitButton disabled={!isDirty}>Save changes</form.SubmitButton>
                    </form.AppForm>
                  )}
                </form.Subscribe>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
