import { useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { publicPagePath } from '@/lib/format'
import {
  businessNameSchema,
  emailSchema,
  emptyToUndefined,
  optionalPhoneSchema,
  optionalText,
  personNameSchema,
  slugify,
  slugSchema,
  toE164,
} from '@/lib/validation'
import { useCreateTenant } from '../api'

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New business
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a business</DialogTitle>
          <DialogDescription>
            The Owner gets an email to set their password. You never see or set it.
          </DialogDescription>
        </DialogHeader>
        <CreateTenantForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

const createTenantSchema = z.object({
  name: businessNameSchema,
  slug: slugSchema,
  phone: optionalPhoneSchema,
  city: optionalText(100),
  address: optionalText(300),
  ownerName: personNameSchema,
  ownerEmail: emailSchema,
})

function CreateTenantForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const create = useCreateTenant()

  const form = useAppForm({
    defaultValues: { name: '', slug: '', phone: '', city: '', address: '', ownerName: '', ownerEmail: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: createTenantSchema },
    onSubmit: async ({ value }) => {
      try {
        const { tenant, owner } = await create.mutateAsync({
          name: value.name.trim(),
          slug: value.slug,
          phone: value.phone.trim() ? (toE164(value.phone) ?? undefined) : undefined,
          city: emptyToUndefined(value.city),
          address: emptyToUndefined(value.address),
          owner: { name: value.ownerName.trim(), email: value.ownerEmail.trim() },
        })
        toast.success(
          owner.status === 'PENDING_SETUP'
            ? `${tenant.name} created. ${owner.name} was emailed a link to set their password.`
            : `${tenant.name} created. ${owner.name} already uses SlotWise and was notified.`,
        )
        onDone()
        await navigate({ to: '/admin/tenants/$tenantId', params: { tenantId: tenant.id } })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Business</FieldLegend>
          <FieldGroup>
            <form.AppField
              name="name"
              listeners={{
                // Suggest the address from the name until someone edits it.
                onChange: ({ value, fieldApi }) => {
                  if (!fieldApi.form.getFieldMeta('slug')?.isDirty) {
                    fieldApi.form.setFieldValue('slug', slugify(value), { dontUpdateMeta: true })
                  }
                },
              }}
            >
              {(field) => <field.TextField label="Business name" placeholder="Glow Salon" autoFocus />}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.slug}>
              {(slug) => (
                <form.AppField name="slug">
                  {(field) => (
                    <field.TextField
                      label="Booking page address"
                      placeholder="glow-salon"
                      description={`${window.location.host}${publicPagePath(slug || 'your-business')}`}
                      transform={(value) => value.toLowerCase()}
                    />
                  )}
                </form.AppField>
              )}
            </form.Subscribe>
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="phone">
                {(field) => <field.TextField label="Phone (optional)" type="tel" placeholder="98765 43210" />}
              </form.AppField>
              <form.AppField name="city">
                {(field) => <field.TextField label="City (optional)" placeholder="Ahmedabad" />}
              </form.AppField>
            </div>
            <form.AppField name="address">
              {(field) => <field.TextareaField label="Address (optional)" rows={2} />}
            </form.AppField>
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Owner</FieldLegend>
          <FieldGroup>
            <form.AppField name="ownerName">
              {(field) => <field.TextField label="Full name" placeholder="Asha Patel" />}
            </form.AppField>
            <form.AppField name="ownerEmail">
              {(field) => <field.TextField label="Email" type="email" placeholder="owner@business.com" />}
            </form.AppField>
          </FieldGroup>
        </FieldSet>
        <FormError error={create.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>Create business</form.SubmitButton>
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
