import { MailCheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { MAILPIT_URL } from '@/lib/env'

/** "We sent you a link" confirmation, with a Mailpit shortcut in development. */
export function CheckEmail({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
        <MailCheckIcon className="size-5" />
      </span>
      <div className="text-sm text-muted-foreground">{children}</div>
      {import.meta.env.DEV ? (
        <a
          href={MAILPIT_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Dev: open Mailpit
        </a>
      ) : null}
    </div>
  )
}
