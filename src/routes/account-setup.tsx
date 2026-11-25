import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { accountSetupQueryOptions, homePath, useCompleteAccountSetup } from '@/features/auth/api'
import { LinkProblem } from '@/features/auth/components/link-problem'
import { ApiError, ErrorCode, isApiError } from '@/lib/api/errors'
import { PASSWORD_MIN_LENGTH, setPasswordSchema } from '@/lib/validation'

/**
 * A new Owner / team member's set-password link: `/account-setup?token=…`
 * (72 h). Setting the password signs them in.
 */
export const Route = createFileRoute('/account-setup')({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ context, deps }) => {
    if (!deps.token) throw new ApiError(410, ErrorCode.LinkExpired, 'Missing link token')
    return context.queryClient.ensureQueryData(accountSetupQueryOptions(deps.token))
  },
  head: () => ({ meta: [{ title: 'Set up your account · SlotWise' }] }),
  component: AccountSetupPage,
  errorComponent: ({ error }) => (
    <LinkProblem error={error} title={isApiError(error) && error.status === 410 ? 'This invite link has expired' : undefined}>
      <p className="text-center text-sm text-muted-foreground">
        Ask whoever invited you to send a new link. If you already set your password, just sign in.
      </p>
      <Button asChild variant="outline">
        <Link to="/login">Go to sign in</Link>
      </Button>
    </LinkProblem>
  ),
})

function AccountSetupPage() {
  const { token } = Route.useSearch()
  const { data: invite } = useSuspenseQuery(accountSetupQueryOptions(token ?? ''))
  const navigate = useNavigate()
  const complete = useCompleteAccountSetup()

  const form = useAppForm({
    defaultValues: { password: '', confirm: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: setPasswordSchema },
    onSubmit: async ({ value }) => {
      if (!token) return
      try {
        const viewer = await complete.mutateAsync({ token, password: value.password })
        await navigate({ href: homePath(viewer), replace: true })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <AuthLayout
      title={`Welcome, ${invite.name.split(' ')[0]}`}
      description={
        invite.businessName
          ? `Choose a password to start using SlotWise at ${invite.businessName}.`
          : 'Choose a password to start using SlotWise.'
      }
    >
      <form onSubmit={submitHandler(form)} noValidate>
        <FieldGroup>
          <div className="grid gap-2">
            <Label htmlFor="setup-email">Email</Label>
            <Input id="setup-email" value={invite.email} readOnly disabled autoComplete="username" />
          </div>
          <form.AppField name="password">
            {(field) => (
              <field.PasswordField
                label="Password"
                autoComplete="new-password"
                description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
                autoFocus
              />
            )}
          </form.AppField>
          <form.AppField name="confirm">
            {(field) => <field.PasswordField label="Confirm password" autoComplete="new-password" />}
          </form.AppField>
          <FormError error={complete.error} />
          <form.AppForm>
            <form.SubmitButton className="w-full">Set password and continue</form.SubmitButton>
          </form.AppForm>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
