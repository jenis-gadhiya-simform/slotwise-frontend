import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/api'
import { api } from '@/lib/api/client'
import type { PublicBusiness, Tenant } from '@/lib/types'

/** The business a staff user is acting in (F01), and public booking pages. */

export const businessKeys = {
  current: (tenantId: string) => ['tenant', tenantId, 'business'] as const,
  public: (slug: string) => ['public', slug] as const,
}

export const currentBusinessQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: businessKeys.current(tenantId),
    queryFn: ({ signal }) => api<Tenant>('/tenants/current', { tenantId, signal }),
  })

export interface UpdateBusinessInput {
  name?: string
  phone?: string | null
  city?: string | null
  address?: string | null
}

export function useUpdateBusiness(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateBusinessInput) =>
      api<Tenant>('/tenants/current', { method: 'PATCH', body, tenantId }),
    onSuccess: (tenant) => {
      queryClient.setQueryData(businessKeys.current(tenantId), tenant)
      // The business name also shows in the switcher (from /me).
      return queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export const publicBusinessQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: businessKeys.public(slug),
    queryFn: ({ signal }) => api<PublicBusiness>(`/public/${slug}`, { signal }),
  })
