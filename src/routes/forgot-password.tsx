import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useForgotPassword } from '@/features/auth/api'
import { CheckEmail } from '@/features/auth/components/check-email'
import { emailSchema } from '@/lib/validation'

export const Route = createFileRoute('/forgot-password')({
  validateSearch: z.object({
    type: z.enum(['staff', 'customer']).default('staff').catch('staff'),
    email: z.string().optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: 'Reset password · SlotWise' }] }),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { type, email } = Route.useSearch()
  const forgot = useForgotPassword()
  const signInPath = type === 'staff' ? '/login' : '/customer/login'

  const form = useAppForm({
    defaultValues: { email: email ?? '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: z.object({ email: emailSchema }) },
    onSubmit: async ({ value }) => {
      try {
        await forgot.mutateAsync({ email: value.email.trim(), accountType: type })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  const backToSignIn = (
    <Link to={signInPath} className="underline underline-offset-4">
      Back to sign in
    </Link>
  )

  if (forgot.isSuccess) {
    return (
      <AuthLayout title="Check your email" footer={backToSignIn}>
        <CheckEmail>
          If an account exists for <strong className="text-foreground">{forgot.variables.email}</strong>,
          we’ve sent a link to reset your password. It expires in 30 minutes.
        </CheckEmail>
        <Button variant="outline" className="mt-4 w-full" onClick={() => forgot.reset()}>
          Use a different email
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we’ll send you a link to choose a new one."
      footer={backToSignIn}
    >
      <form onSubmit={submitHandler(form)} noValidate>
        <FieldGroup>
          <form.AppField name="email">
            {(field) => <field.TextField label="Email" type="email" autoComplete="email" autoFocus />}
          </form.AppField>
          <FormError error={forgot.error} />
          <form.AppForm>
            <form.SubmitButton className="w-full">Send reset link</form.SubmitButton>
          </form.AppForm>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
