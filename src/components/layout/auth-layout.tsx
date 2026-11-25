import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface AuthLayoutProps {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Centered card for sign-in, set-password and link pages. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <Link to="/" aria-label="SlotWise home">
        <Logo className="text-lg" />
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? (
          <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
        ) : null}
      </Card>
    </div>
  )
}
