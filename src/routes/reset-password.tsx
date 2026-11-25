import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordPage } from '@/features/auth/components/reset-password-form'

/** Staff reset link: `/reset-password?token=…` (emailed by the API). */
export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  head: () => ({ meta: [{ title: 'Choose a new password · SlotWise' }] }),
  component: function StaffResetPassword() {
    const { token } = Route.useSearch()
    return <ResetPasswordPage token={token} accountType="staff" />
  },
})
