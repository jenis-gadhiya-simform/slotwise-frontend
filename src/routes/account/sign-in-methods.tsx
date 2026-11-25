import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  identitiesQueryOptions,
  socialProvidersQueryOptions,
  useChangeCustomerPassword,
  useStartIdentityLink,
  useUnlinkIdentity,
} from '@/features/auth/api'
import { ProviderIcon } from '@/features/auth/components/social-buttons'
import { PROVIDER_LABELS } from '@/features/auth/providers'
import { errorMessage, ApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { SocialProvider } from '@/lib/types'
import { currentPasswordSchema, newPasswordSchema, PASSWORD_MIN_LENGTH } from '@/lib/validation'
import { useCustomer } from '@/features/auth/use-customer'

/**
 * Password and connected Google / Microsoft accounts. Linking ends back here
 * with `?linked=<provider>` or `?error=CODE`.
 */
export const Route = createFileRoute('/account/sign-in-methods')({
  validateSearch: z.object({
    linked: z.enum(SocialProvider).optional().catch(undefined),
    error: z.string().optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: 'Sign-in methods · SlotWise' }] }),
  component: SignInMethodsPage,
})

function SignInMethodsPage() {
  useLinkOutcomeToast()
  const { hasPassword } = useCustomer()
  return (
    <>
      <PageHeader title="Sign-in methods" description="Choose how you get into your account." />
      <div className="grid max-w-2xl gap-6">
        {/* Remount when a password is first set: the form's fields and rules differ. */}
        <PasswordCard key={hasPassword ? 'change' : 'set'} />
        <ConnectedAccountsCard />
      </div>
    </>
  )
}

/** Shows the result of a link redirect once, then cleans the URL. */
function useLinkOutcomeToast() {
  const { linked, error } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  useEffect(() => {
    if (!linked && !error) return
    // Fixed ids: StrictMode's second run replaces the toast instead of duplicating it.
    if (linked) toast.success(`${PROVIDER_LABELS[linked]} connected.`, { id: 'identity-linked' })
    if (error) toast.error(errorMessage(new ApiError(400, error, 'Linking failed')), { id: 'identity-error' })
    void navigate({ search: {}, replace: true })
  }, [linked, error, navigate])
}

function PasswordCard() {
  const viewer = useCustomer()
  const change = useChangeCustomerPassword()
  const hasPassword = viewer.hasPassword

  const schema = z
    .object({
      currentPassword: hasPassword ? currentPasswordSchema : z.string(),
      newPassword: newPasswordSchema,
      confirm: z.string(),
    })
    .refine((v) => v.newPassword === v.confirm, { message: 'Passwords don’t match', path: ['confirm'] })

  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await change.mutateAsync({
          currentPassword: hasPassword ? value.currentPassword : undefined,
          newPassword: value.newPassword,
        })
        formApi.reset()
        toast.success(hasPassword ? 'Password changed. Other devices were signed out.' : 'Password set.')
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          {hasPassword
            ? 'Changing it signs you out on your other devices.'
            : 'Optional. Add one to sign in without waiting for an email. For your security, you can set it within 15 minutes of signing in with an email link.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitHandler(form)} noValidate>
          <FieldGroup>
            {hasPassword ? (
              <form.AppField name="currentPassword">
                {(field) => <field.PasswordField label="Current password" autoComplete="current-password" />}
              </form.AppField>
            ) : null}
            <form.AppField name="newPassword">
              {(field) => (
                <field.PasswordField
                  label="New password"
                  autoComplete="new-password"
                  description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
                />
              )}
            </form.AppField>
            <form.AppField name="confirm">
              {(field) => <field.PasswordField label="Confirm new password" autoComplete="new-password" />}
            </form.AppField>
            <FormError error={change.error} />
            <div className="flex justify-end">
              <form.AppForm>
                <form.SubmitButton>{hasPassword ? 'Change password' : 'Set password'}</form.SubmitButton>
              </form.AppForm>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function ConnectedAccountsCard() {
  const { data: providers = [] } = useQuery(socialProvidersQueryOptions())
  const { data: identities = [], isPending } = useQuery(identitiesQueryOptions())
  const link = useStartIdentityLink()
  const unlink = useUnlinkIdentity()
  const [disconnecting, setDisconnecting] = useState<SocialProvider | null>(null)

  if (providers.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected accounts</CardTitle>
        <CardDescription>Sign in with one click. You can always still sign in with an email link.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {isPending ? (
          <Spinner />
        ) : (
          providers.map((provider) => {
            const identity = identities.find((i) => i.provider === provider)
            return (
              <div key={provider} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex size-9 items-center justify-center rounded-md border">
                  <ProviderIcon provider={provider} />
                </span>
                <div className="grid flex-1 text-sm leading-tight">
                  <span className="font-medium">{PROVIDER_LABELS[provider]}</span>
                  <span className="text-muted-foreground">
                    {identity
                      ? `${identity.email ?? 'Connected'} · since ${formatDate(identity.createdAt)}`
                      : 'Not connected'}
                  </span>
                </div>
                {identity ? (
                  <Button variant="outline" size="sm" onClick={() => setDisconnecting(provider)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={link.isPending}
                    onClick={() => link.mutate(provider, { onError: (error) => toast.error(errorMessage(error)) })}
                  >
                    {link.isPending && link.variables === provider ? <Spinner /> : null}
                    Connect
                  </Button>
                )}
              </div>
            )
          })
        )}
      </CardContent>

      <ConfirmDialog
        open={disconnecting !== null}
        onOpenChange={(open) => !open && setDisconnecting(null)}
        title={disconnecting ? `Disconnect ${PROVIDER_LABELS[disconnecting]}?` : ''}
        description="You won’t be able to sign in with it anymore. You can reconnect it any time."
        confirmLabel="Disconnect"
        destructive
        pending={unlink.isPending}
        onConfirm={() => {
          if (!disconnecting) return
          unlink.mutate(disconnecting, {
            onSuccess: () => {
              toast.success(`${PROVIDER_LABELS[disconnecting]} disconnected.`)
              setDisconnecting(null)
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }}
      />
    </Card>
  )
}
