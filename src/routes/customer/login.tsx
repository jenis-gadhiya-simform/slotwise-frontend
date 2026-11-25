import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { homePath, useCustomerLogin, useRequestMagicLink } from '@/features/auth/api'
import { redirectIfSignedIn } from '@/features/auth/guards'
import { CheckEmail } from '@/features/auth/components/check-email'
import { SocialButtons } from '@/features/auth/components/social-buttons'
import { publicBusinessQueryOptions } from '@/features/business/api'
import { currentPasswordSchema, emailSchema, safeRedirectPath } from '@/lib/validation'

export const Route = createFileRoute('/customer/login')({
  validateSearch: z.object({
    /** The business whose booking page the customer came from. */
    tenant: z.string().optional().catch(undefined),
    redirectTo: z.string().optional().catch(undefined),
  }),
  beforeLoad: redirectIfSignedIn,
  head: () => ({ meta: [{ title: 'Sign in · SlotWise' }] }),
  component: CustomerLoginPage,
})

function CustomerLoginPage() {
  const { tenant, redirectTo } = Route.useSearch()
  const { data: business } = useQuery({
    ...publicBusinessQueryOptions(tenant ?? ''),
    enabled: Boolean(tenant),
  })
  const returnTo = safeRedirectPath(redirectTo) ?? (tenant ? `/b/${tenant}` : undefined)

  return (
    <AuthLayout
      title="Sign in"
      description={business ? `to book with ${business.name}` : 'to book and manage your appointments'}
      footer={
        <span>
          Work at a business?{' '}
          <Link to="/login" className="text-foreground underline underline-offset-4">
            Staff sign in
          </Link>
        </span>
      }
    >
      <SocialButtons redirectTo={returnTo} tenantSlug={tenant} />
      <Tabs defaultValue="link">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="link">Email link</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="link">
          <MagicLinkForm tenantSlug={tenant} />
        </TabsContent>
        <TabsContent value="password">
          <PasswordForm returnTo={returnTo} />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  )
}

const emailOnlySchema = z.object({ email: emailSchema })

function MagicLinkForm({ tenantSlug }: { tenantSlug?: string }) {
  const request = useRequestMagicLink()
  const form = useAppForm({
    defaultValues: { email: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: emailOnlySchema },
    onSubmit: async ({ value }) => {
      try {
        await request.mutateAsync({ email: value.email.trim(), tenantSlug })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  if (request.isSuccess) {
    return (
      <div className="grid gap-4">
        <CheckEmail>
          We sent a sign-in link to <strong className="text-foreground">{request.variables.email}</strong>.
          It works once and expires in 15 minutes.
        </CheckEmail>
        <Button variant="outline" onClick={() => request.reset()}>
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email"
              type="email"
              autoComplete="email"
              description="No password needed: we’ll email you a link that signs you in."
            />
          )}
        </form.AppField>
        <FormError error={request.error} />
        <form.AppForm>
          <form.SubmitButton className="w-full">Email me a sign-in link</form.SubmitButton>
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}

const passwordLoginSchema = z.object({ email: emailSchema, password: currentPasswordSchema })

function PasswordForm({ returnTo }: { returnTo?: string }) {
  const navigate = useNavigate()
  const login = useCustomerLogin()
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: passwordLoginSchema },
    onSubmit: async ({ value }) => {
      try {
        const viewer = await login.mutateAsync({ email: value.email.trim(), password: value.password })
        await navigate({ href: returnTo ?? homePath(viewer), replace: true })
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="email">
          {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
        </form.AppField>
        <div className="grid gap-2">
          <form.AppField name="password">
            {(field) => <field.PasswordField label="Password" autoComplete="current-password" />}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.email}>
            {(email) => (
              <Link
                to="/forgot-password"
                search={{ type: 'customer', email: email || undefined }}
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
  )
}
