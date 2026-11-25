import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordPage } from '@/features/auth/components/reset-password-form'

/** Customer reset link: `/customer/reset-password?token=…` (emailed by the API). */
export const Route = createFileRoute('/customer/reset-password')({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  head: () => ({ meta: [{ title: 'Choose a new password · SlotWise' }] }),
  component: function CustomerResetPassword() {
    const { token } = Route.useSearch()
    return <ResetPasswordPage token={token} accountType="customer" />
  },
})
