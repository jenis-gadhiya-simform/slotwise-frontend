import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { errorMessage, isApiError } from '@/lib/api/errors'

/** The API's answer to a failed submit, shown above the submit button. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon />
      <AlertDescription>
        {errorMessage(error)}
        {isApiError(error) && error.status >= 500 && error.requestId ? (
          <span className="mt-1 block text-xs opacity-70">Reference: {error.requestId}</span>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
