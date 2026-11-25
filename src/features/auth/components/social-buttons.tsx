import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import type { SocialProvider } from '@/lib/types'
import { socialLoginUrl, socialProvidersQueryOptions } from '../api'
import { PROVIDER_LABELS } from '../providers'

export function ProviderIcon({ provider }: { provider: SocialProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  )
}

interface SocialButtonsProps {
  redirectTo?: string
  tenantSlug?: string
}

/** Continue with Google / Microsoft, for the providers the API has enabled. */
export function SocialButtons({ redirectTo, tenantSlug }: SocialButtonsProps) {
  const { data: providers = [] } = useQuery(socialProvidersQueryOptions())
  if (providers.length === 0) return null

  return (
    <>
      <div className="grid gap-2">
        {providers.map((provider) => (
          <Button key={provider} variant="outline" asChild>
            {/* A full-page navigation: the API redirects to the provider. */}
            <a href={socialLoginUrl(provider, { redirectTo, tenantSlug })}>
              <ProviderIcon provider={provider} />
              Continue with {PROVIDER_LABELS[provider]}
            </a>
          </Button>
        ))}
      </div>
      <FieldSeparator className="my-4">or</FieldSeparator>
    </>
  )
}
