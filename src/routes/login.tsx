import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { AuthLayout } from '@/components/layout/auth-layout'
import { FieldGroup } from '@/components/ui/field'
import { homePath, useStaffLogin } from '@/features/auth/api'
import { redirectIfSignedIn } from '@/features/auth/guards'
import { currentPasswordSchema, emailSchema, safeRedirectPath } from '@/lib/validation'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: redirectIfSignedIn,
  head: () => ({ meta: [{ title: 'Sign in · SlotWise' }] }),
  component: StaffLoginPage,
})

const loginSchema = z.object({ email: emailSchema, password: currentPasswordSchema })

function StaffLoginPage() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const login = useStaffLogin()

  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: loginSchema },
    onSubmit: async ({ value }) => {
      try {
        const viewer = await login.mutateAsync({ email: value.email.trim(), password: value.password })
        await navigate({ href: safeRedirectPath(redirect) ?? homePath(viewer), replace: true })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <AuthLayout
      title="Sign in to your business"
      description="For owners, managers, receptionists and staff."
      footer={
        <span>
          Booking an appointment?{' '}
          <Link to="/customer/login" className="text-foreground underline underline-offset-4">
            Customer sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={submitHandler(form)} noValidate>
        <FieldGroup>
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Email" type="email" autoComplete="email" placeholder="you@business.com" autoFocus />
            )}
          </form.AppField>
          <div className="grid gap-2">
            <form.AppField name="password">
              {(field) => <field.PasswordField label="Password" autoComplete="current-password" />}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.email}>
              {(email) => (
                <Link
                  to="/forgot-password"
                  search={{ type: 'staff', email: email || undefined }}
                  className="justify-self-end text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </form.Subscribe>
          </div>
          <FormError error={login.error} />
          <form.AppForm>
            <form.SubmitButton className="w-full">Sign in</form.SubmitButton>
          </form.AppForm>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
