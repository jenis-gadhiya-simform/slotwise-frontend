import { UserPlusIcon } from 'lucide-react'
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
import { FieldGroup } from '@/components/ui/field'
import { manageableRoles, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/permissions'
import { MemberRole } from '@/lib/types'
import { emailSchema, personNameSchema } from '@/lib/validation'
import { useAddMember } from '../api'

interface AddMemberDialogProps {
  tenantId: string
  actorRole: MemberRole
}

export function AddMemberDialog({ tenantId, actorRole }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            They’ll get an email to set their password. People who already use SlotWise just get access.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts with a clean form. */}
        <AddMemberForm tenantId={tenantId} actorRole={actorRole} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

const roleSchema = z.enum([MemberRole.MANAGER, MemberRole.RECEPTIONIST, MemberRole.STAFF])
const addMemberSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  role: roleSchema,
  bookable: z.boolean(),
})
type AddMemberValues = z.input<typeof addMemberSchema>

function AddMemberForm({ tenantId, actorRole, onDone }: AddMemberDialogProps & { onDone: () => void }) {
  const add = useAddMember(tenantId)
  const roles = manageableRoles(actorRole) as readonly AddMemberValues['role'][]
  const roleOptions = roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

  const form = useAppForm({
    defaultValues: { name: '', email: '', role: MemberRole.STAFF, bookable: true } as AddMemberValues,
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: addMemberSchema },
    onSubmit: async ({ value }) => {
      try {
        const { member } = await add.mutateAsync({
          name: value.name.trim(),
          email: value.email.trim(),
          role: value.role,
          // Staff always have a calendar.
          bookable: value.role === MemberRole.STAFF ? true : value.bookable,
        })
        toast.success(
          member.status === 'PENDING_SETUP'
            ? `Invitation sent to ${member.email}.`
            : `${member.name} now has access and was notified by email.`,
        )
        onDone()
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="name">
          {(field) => <field.TextField label="Full name" autoComplete="off" autoFocus />}
        </form.AppField>
        <form.AppField name="email">
          {(field) => <field.TextField label="Email" type="email" autoComplete="off" />}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.role}>
          {(role) => (
            <>
              <form.AppField name="role">
                {(field) => (
                  <field.SelectField label="Role" options={roleOptions} description={ROLE_DESCRIPTIONS[role]} />
                )}
              </form.AppField>
              <form.AppField name="bookable">
                {(field) => (
                  <field.SwitchField
                    label="Takes bookings"
                    description={
                      role === MemberRole.STAFF
                        ? 'Staff always have a calendar customers can book.'
                        : 'Give them a calendar customers can book.'
                    }
                    disabled={role === MemberRole.STAFF}
                  />
                )}
              </form.AppField>
            </>
          )}
        </form.Subscribe>
        <FormError error={add.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>Send invite</form.SubmitButton>
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
