import { MemberRole, type Membership } from '@/lib/types'

/**
 * What each role may do, mirroring the API's RBAC (F03 role map; enforced
 * today by `@TenantScoped(...)` and `team-roles.ts`). The UI uses it to hide
 * what would only end in a 403; the API remains the authority.
 */

export const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  RECEPTIONIST: 'Receptionist',
  STAFF: 'Staff',
}

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  OWNER: 'Owns the business and can do everything.',
  MANAGER: 'Runs day-to-day: business profile, team and calendars.',
  RECEPTIONIST: 'Front desk: sees the team and calendars.',
  STAFF: 'Takes appointments on their own calendar.',
}

const MANAGEABLE: Record<MemberRole, readonly MemberRole[]> = {
  OWNER: [MemberRole.MANAGER, MemberRole.RECEPTIONIST, MemberRole.STAFF],
  MANAGER: [MemberRole.RECEPTIONIST, MemberRole.STAFF],
  RECEPTIONIST: [],
  STAFF: [],
}

const isOwnerOrManager = (role: MemberRole) =>
  role === MemberRole.OWNER || role === MemberRole.MANAGER

export const can = {
  /** `PATCH /tenants/current`. */
  editBusiness: isOwnerOrManager,
  /** `/members` (all routes). */
  manageTeam: isOwnerOrManager,
  /** `PATCH /staff/:id` with `active` or any calendar's name. */
  manageCalendars: isOwnerOrManager,
}

/** Roles `actor` may add, change to, or remove. Never OWNER (ownership transfer). */
export const manageableRoles = (actor: MemberRole): readonly MemberRole[] =>
  MANAGEABLE[actor]

export const canManageRole = (actor: MemberRole, target: MemberRole): boolean =>
  MANAGEABLE[actor].includes(target)

/** Staff may rename their own calendar; Owners and Managers any. */
export const canRenameCalendar = (membership: Membership, staffId: string) =>
  can.manageCalendars(membership.role) || membership.staffId === staffId
