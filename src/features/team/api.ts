import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Member, MemberRole, MemberStatus, StaffCalendar } from '@/lib/types'

/** Team members and staff calendars of the current business (F04). */

export interface MemberFilters {
  status?: MemberStatus
  role?: MemberRole
}

export const teamKeys = {
  all: (tenantId: string) => ['tenant', tenantId, 'team'] as const,
  members: (tenantId: string, filters: MemberFilters) =>
    [...teamKeys.all(tenantId), 'members', filters] as const,
  calendars: (tenantId: string, active: boolean) =>
    [...teamKeys.all(tenantId), 'calendars', { active }] as const,
}

export const membersQueryOptions = (tenantId: string, filters: MemberFilters) =>
  queryOptions({
    queryKey: teamKeys.members(tenantId, filters),
    queryFn: ({ signal }) =>
      api<{ items: Member[] }>('/members', {
        tenantId,
        query: { status: filters.status, role: filters.role },
        signal,
      }),
    select: (data) => data.items,
  })

export const calendarsQueryOptions = (tenantId: string, active: boolean) =>
  queryOptions({
    queryKey: teamKeys.calendars(tenantId, active),
    queryFn: ({ signal }) =>
      api<{ items: StaffCalendar[] }>('/staff', {
        tenantId,
        query: { active },
        signal,
      }),
    select: (data) => data.items,
  })

/** Members and calendars are linked (bookable ↔ active), so refresh both. */
function useInvalidateTeam(tenantId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: teamKeys.all(tenantId) })
}

export interface AddMemberInput {
  name: string
  email: string
  role: MemberRole
  bookable?: boolean
}

export function useAddMember(tenantId: string) {
  const invalidate = useInvalidateTeam(tenantId)
  return useMutation({
    mutationFn: (body: AddMemberInput) =>
      api<{ member: Member }>('/members', { method: 'POST', body, tenantId }),
    onSuccess: invalidate,
  })
}

export function useUpdateMember(tenantId: string) {
  const invalidate = useInvalidateTeam(tenantId)
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; role?: MemberRole; bookable?: boolean }) =>
      api<{ member: Member }>(`/members/${id}`, { method: 'PATCH', body, tenantId }),
    onSuccess: invalidate,
  })
}

export function useRemoveMember(tenantId: string) {
  const invalidate = useInvalidateTeam(tenantId)
  return useMutation({
    mutationFn: (id: string) =>
      api(`/members/${id}`, { method: 'DELETE', tenantId }),
    onSuccess: invalidate,
  })
}

export const useResendMemberSetup = (tenantId: string) =>
  useMutation({
    mutationFn: (id: string) =>
      api<{ member: Member }>(`/members/${id}/resend-setup`, {
        method: 'POST',
        tenantId,
      }),
  })

export function useUpdateCalendar(tenantId: string) {
  const invalidate = useInvalidateTeam(tenantId)
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; displayName?: string; active?: boolean }) =>
      api<StaffCalendar>(`/staff/${id}`, { method: 'PATCH', body, tenantId }),
    onSuccess: invalidate,
  })
}
