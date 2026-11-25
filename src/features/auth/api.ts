import {
  queryOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { clearSession, setSession, type TokenResponse } from '@/lib/auth/session'
import { API_URL } from '@/lib/env'
import type {
  AccountType,
  LinkedIdentity,
  SocialProvider,
  Viewer,
} from '@/lib/types'

export const authKeys = {
  me: ['me'] as const,
  identities: ['me', 'identities'] as const,
  socialProviders: ['auth', 'social-providers'] as const,
  accountSetup: (token: string) => ['auth', 'account-setup', token] as const,
}

// Queries

export const meQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => api<Viewer>('/me', { signal }),
    staleTime: 60_000,
  })

export const socialProvidersQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.socialProviders,
    queryFn: ({ signal }) =>
      api<{ providers: SocialProvider[] }>('/auth/customer/oidc/providers', {
        signal,
      }),
    select: (data) => data.providers,
    staleTime: Infinity,
  })

export const identitiesQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.identities,
    queryFn: ({ signal }) => api<LinkedIdentity[]>('/me/identities', { signal }),
  })

export interface AccountSetupInfo {
  email: string
  name: string
  businessName: string | null
}

export const accountSetupQueryOptions = (token: string) =>
  queryOptions({
    queryKey: authKeys.accountSetup(token),
    queryFn: ({ signal }) =>
      api<AccountSetupInfo>(`/auth/account-setup/${encodeURIComponent(token)}`, {
        signal,
      }),
    retry: false,
    staleTime: Infinity,
  })

// Sign-in

/** Where a signed-in account belongs. */
export function homePath(viewer: Viewer): string {
  if (viewer.kind === 'customer') return '/account'
  return viewer.isPlatformAdmin ? '/admin/tenants' : '/app'
}

/**
 * Starts a fresh session: no cached data from a previous account survives.
 * Returns the new viewer so the caller can route them.
 */
export async function startSession(
  queryClient: QueryClient,
  tokens: TokenResponse,
): Promise<Viewer> {
  setSession(tokens)
  queryClient.clear()
  return queryClient.fetchQuery(meQueryOptions())
}

interface Credentials {
  email: string
  password: string
}

function useSignInMutation<T>(request: (input: T) => Promise<TokenResponse>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: T) => startSession(queryClient, await request(input)),
  })
}

export const useStaffLogin = () =>
  useSignInMutation((body: Credentials) =>
    api<TokenResponse>('/auth/staff/login', { method: 'POST', body }),
  )

export const useCustomerLogin = () =>
  useSignInMutation((body: Credentials) =>
    api<TokenResponse>('/auth/customer/login', { method: 'POST', body }),
  )

export const useCompleteAccountSetup = () =>
  useSignInMutation((body: { token: string; password: string }) =>
    api<TokenResponse>('/auth/account-setup', { method: 'POST', body }),
  )

export const verifyMagicLink = (token: string) =>
  api<TokenResponse>('/auth/customer/magic-link/verify', {
    method: 'POST',
    body: { token },
  })

export const useRequestMagicLink = () =>
  useMutation({
    mutationFn: (body: { email: string; tenantSlug?: string }) =>
      api('/auth/customer/magic-link', { method: 'POST', body }),
  })

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (body: { email: string; accountType: AccountType }) =>
      api('/auth/password/forgot', { method: 'POST', body }),
  })

export const useResetPassword = () =>
  useMutation({
    mutationFn: (body: {
      token: string
      accountType: AccountType
      password: string
    }) => api('/auth/password/reset', { method: 'POST', body }),
  })

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    // Sign out locally even if the API call fails.
    onSettled: () => {
      clearSession()
      queryClient.clear()
    },
  })
}

/** A browser navigation (redirects through Google / Microsoft), not a fetch. */
export function socialLoginUrl(
  provider: SocialProvider,
  params: { redirectTo?: string; tenantSlug?: string } = {},
): string {
  const url = new URL(`${API_URL}/auth/customer/oidc/${provider}/login`)
  if (params.redirectTo) url.searchParams.set('redirectTo', params.redirectTo)
  if (params.tenantSlug) url.searchParams.set('tenantSlug', params.tenantSlug)
  return url.toString()
}

// Customer account

export function useChangeCustomerPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { currentPassword?: string; newPassword: string }) =>
      api<TokenResponse>('/me/password', { method: 'POST', body }),
    // Other devices are signed out; this one gets fresh tokens.
    onSuccess: async (tokens) => {
      setSession(tokens)
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export const useStartIdentityLink = () =>
  useMutation({
    mutationFn: (provider: SocialProvider) =>
      api<{ url: string }>(`/me/identities/${provider}/link`, { method: 'POST' }),
    onSuccess: ({ url }) => window.location.assign(url),
  })

export function useUnlinkIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: SocialProvider) =>
      api(`/me/identities/${provider}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  })
}
