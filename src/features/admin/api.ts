import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Page, Tenant, TenantOwner, TenantStatus } from '@/lib/types'

/** Platform admin: businesses and their Owners (F01). */

export const adminKeys = {
  tenants: ['admin', 'tenants'] as const,
  tenantList: (status?: TenantStatus) =>
    [...adminKeys.tenants, 'list', { status }] as const,
  tenant: (id: string) => [...adminKeys.tenants, 'detail', id] as const,
}

const PAGE_SIZE = 25

export const tenantsInfiniteQueryOptions = (status?: TenantStatus) =>
  infiniteQueryOptions({
    queryKey: adminKeys.tenantList(status),
    queryFn: ({ pageParam, signal }) =>
      api<Page<Tenant>>('/admin/tenants', {
        query: { status, cursor: pageParam, limit: PAGE_SIZE },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export interface TenantDetail {
  tenant: Tenant
  owner: TenantOwner | null
}

export const tenantDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.tenant(id),
    queryFn: ({ signal }) => api<TenantDetail>(`/admin/tenants/${id}`, { signal }),
  })

export interface CreateTenantInput {
  name: string
  slug: string
  phone?: string
  city?: string
  address?: string
  owner: { name: string; email: string }
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTenantInput) =>
      api<{ tenant: Tenant; owner: TenantOwner }>('/admin/tenants', {
        method: 'POST',
        body,
      }),
    onSuccess: ({ tenant, owner }) => {
      queryClient.setQueryData(adminKeys.tenant(tenant.id), { tenant, owner })
      return queryClient.invalidateQueries({ queryKey: adminKeys.tenants })
    },
  })
}

export const useResendOwnerSetup = (tenantId: string) =>
  useMutation({
    mutationFn: () =>
      api<{ owner: TenantOwner }>(`/admin/tenants/${tenantId}/owner/resend-setup`, {
        method: 'POST',
      }),
  })

export function useReplacePendingOwner(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; email: string }) =>
      api<{ owner: TenantOwner }>(`/admin/tenants/${tenantId}/owner`, {
        method: 'PUT',
        body,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.tenant(tenantId) }),
  })
}
