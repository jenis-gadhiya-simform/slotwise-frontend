import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { CircleAlertIcon, CompassIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { errorMessage } from '@/lib/api/errors'

export function PendingPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  )
}

/** Default route error boundary: explains, and offers a retry. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <Empty className="min-h-[50vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Couldn’t load this page</EmptyTitle>
        <EmptyDescription>{errorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          onClick={() => {
            reset()
            void router.invalidate()
          }}
        >
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function NotFound() {
  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CompassIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>The page you’re looking for doesn’t exist or has moved.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
