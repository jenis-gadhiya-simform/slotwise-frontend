import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { isApiError } from '@/lib/api/errors'
import type { AccountType } from '@/lib/types'
import { PASSWORD_MIN_LENGTH, setPasswordSchema } from '@/lib/validation'
import { useResetPassword } from '../api'
import { LinkProblem } from './link-problem'

interface ResetPasswordFormProps {
  token: string | undefined
  accountType: AccountType
}

/** Set a new password from an emailed reset link (staff or customer). */
export function ResetPasswordPage({ token, accountType }: ResetPasswordFormProps) {
  const navigate = useNavigate()
  const reset = useResetPassword()
  const signInPath = accountType === 'staff' ? '/login' : '/customer/login'

  const form = useAppForm({
    defaultValues: { password: '', confirm: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: setPasswordSchema },
    onSubmit: async ({ value }) => {
      if (!token) return
      try {
        await reset.mutateAsync({ token, accountType, password: value.password })
        toast.success('Password updated. Sign in with your new password.')
        await navigate({ to: signInPath })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  const requestAgain = (
    <Button asChild>
      <Link to="/forgot-password" search={{ type: accountType }}>
        Send a new reset link
      </Link>
    </Button>
  )

  if (!token) return <LinkProblem>{requestAgain}</LinkProblem>
  if (isApiError(reset.error) && reset.error.status === 410) {
    return <LinkProblem error={reset.error}>{requestAgain}</LinkProblem>
  }

  return (
    <AuthLayout
      title="Choose a new password"
      description="You’ll be signed out on your other devices."
      footer={
        <Link to={signInPath} className="underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submitHandler(form)} noValidate>
        <FieldGroup>
          <form.AppField name="password">
            {(field) => (
              <field.PasswordField
                label="New password"
                autoComplete="new-password"
                description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
                autoFocus
              />
            )}
          </form.AppField>
          <form.AppField name="confirm">
            {(field) => <field.PasswordField label="Confirm password" autoComplete="new-password" />}
          </form.AppField>
          <FormError error={reset.error} />
          <form.AppForm>
            <form.SubmitButton className="w-full">Update password</form.SubmitButton>
          </form.AppForm>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
