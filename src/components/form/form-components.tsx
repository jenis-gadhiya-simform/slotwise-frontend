import { useStore } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useFormContext } from './form-context'

interface SubmitButtonProps extends Omit<React.ComponentProps<typeof Button>, 'type'> {
  children: ReactNode
}

/**
 * Stays enabled while the form is invalid, so a click reveals what's missing;
 * disabled only while submitting.
 */
export function SubmitButton({ children, disabled, ...props }: SubmitButtonProps) {
  const form = useFormContext()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  return (
    <Button type="submit" disabled={isSubmitting || disabled} {...props}>
      {isSubmitting ? <Spinner /> : null}
      {children}
    </Button>
  )
}
