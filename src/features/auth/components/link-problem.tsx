import type { ReactNode } from 'react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { errorMessage, isApiError } from '@/lib/api/errors'

interface LinkProblemProps {
  error?: unknown
  title?: string
  /** What the person can do next (links, buttons). */
  children: ReactNode
}

/** An emailed link that is expired, used, or malformed. */
export function LinkProblem({ error, title, children }: LinkProblemProps) {
  const expired = !error || (isApiError(error) && (error.status === 410 || error.status === 400))
  return (
    <AuthLayout
      title={title ?? (expired ? 'This link has expired' : 'Something went wrong')}
      description={
        expired
          ? 'Links in our emails work once and expire for your security.'
          : errorMessage(error)
      }
    >
      <div className="grid gap-2">{children}</div>
    </AuthLayout>
  )
}
