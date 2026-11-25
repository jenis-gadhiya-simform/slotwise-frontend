/** Shapes the SlotWise API returns (F01, F02, F04). Dates are ISO strings in UTC. */

export const MemberRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  RECEPTIONIST: 'RECEPTIONIST',
  STAFF: 'STAFF',
} as const
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole]

export const TenantStatus = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' } as const
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus]

export const UserStatus = {
  PENDING_SETUP: 'PENDING_SETUP',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

/** Member list filter and row status: setup status, or REMOVED. */
export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  PENDING_SETUP: 'PENDING_SETUP',
  REMOVED: 'REMOVED',
} as const
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus]

export const SocialProvider = { GOOGLE: 'google', MICROSOFT: 'microsoft' } as const
export type SocialProvider = (typeof SocialProvider)[keyof typeof SocialProvider]

export const AccountType = { STAFF: 'staff', CUSTOMER: 'customer' } as const
export type AccountType = (typeof AccountType)[keyof typeof AccountType]

export interface Membership {
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantStatus: TenantStatus
  role: MemberRole
  staffId: string | null
}

export interface StaffViewer {
  kind: typeof AccountType.STAFF
  id: string
  email: string
  name: string
  isPlatformAdmin: boolean
  memberships: Membership[]
}

export interface CustomerViewer {
  kind: typeof AccountType.CUSTOMER
  id: string
  email: string
  hasPassword: boolean
  emailVerified: boolean
  identities: SocialProvider[]
}

/** `GET /me`. */
export type Viewer = StaffViewer | CustomerViewer

export interface Tenant {
  id: string
  slug: string
  name: string
  phone: string | null
  city: string | null
  address: string | null
  status: TenantStatus
  createdAt: string
}

export interface TenantOwner {
  id: string
  email: string
  name: string
  status: UserStatus
}

export interface PublicStaff {
  id: string
  displayName: string
}

export interface PublicBusiness {
  slug: string
  name: string
  phone: string | null
  city: string | null
  address: string | null
  staff: PublicStaff[]
}

export interface Member {
  id: string
  userId: string
  email: string
  name: string
  role: MemberRole
  staffId: string | null
  bookable: boolean
  status: MemberStatus
  createdAt: string
}

export interface StaffCalendar {
  id: string
  displayName: string
  active: boolean
  memberId: string | null
  userId: string | null
}

export interface LinkedIdentity {
  provider: SocialProvider
  email: string | null
  createdAt: string
  lastUsedAt: string | null
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}
