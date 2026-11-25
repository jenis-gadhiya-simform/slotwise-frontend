/**
 * Error codes the API answers with (`{ error: { code, message, requestId } }`).
 * Mirrors backend `ErrorCode`: branch on these, never on messages.
 */
export const ErrorCode = {
  ValidationFailed: 'VALIDATION_FAILED',
  Unauthenticated: 'UNAUTHENTICATED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  RateLimited: 'RATE_LIMITED',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  LinkExpired: 'LINK_EXPIRED',
  ReauthenticationRequired: 'REAUTHENTICATION_REQUIRED',
  WrongAccountType: 'WRONG_ACCOUNT_TYPE',
  SocialSignInFailed: 'SOCIAL_SIGN_IN_FAILED',
  EmailNotVerified: 'EMAIL_NOT_VERIFIED',
  AccountLinkRequired: 'ACCOUNT_LINK_REQUIRED',
  IdentityInUse: 'IDENTITY_IN_USE',
  ProviderAlreadyLinked: 'PROVIDER_ALREADY_LINKED',
  SlugTaken: 'SLUG_TAKEN',
  TenantSuspended: 'TENANT_SUSPENDED',
  NotAMember: 'NOT_A_MEMBER',
  TenantRequired: 'TENANT_REQUIRED',
  OwnerIsPlatformAdmin: 'OWNER_IS_PLATFORM_ADMIN',
  OwnerDisabled: 'OWNER_DISABLED',
  OwnerAlreadyActive: 'OWNER_ALREADY_ACTIVE',
  AlreadyMember: 'ALREADY_MEMBER',
  OwnershipTransferRequired: 'OWNERSHIP_TRANSFER_REQUIRED',
  MemberIsPlatformAdmin: 'MEMBER_IS_PLATFORM_ADMIN',
  MemberDisabled: 'MEMBER_DISABLED',
  MemberAlreadyActive: 'MEMBER_ALREADY_ACTIVE',
  StaffMustBeBookable: 'STAFF_MUST_BE_BOOKABLE',
  /** Client-side only: the request never reached the API. */
  NetworkError: 'NETWORK_ERROR',
} as const
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

interface ErrorEnvelope {
  error: {
    code: string
    message: string
    requestId?: string
    details?: string[]
  }
}

export class ApiError extends Error {
  override readonly name = 'ApiError'
  /** HTTP status; 0 when the request never reached the API. */
  readonly status: number
  /** Stable, machine-readable code to branch on. */
  readonly code: string
  /** Correlates with the API's logs (`X-Request-Id`). */
  readonly requestId: string | undefined
  /** Per-field messages, for validation errors only. */
  readonly details: readonly string[]

  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
    details: readonly string[] = [],
  ) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
    this.details = details
  }

  is(...codes: ErrorCode[]): boolean {
    return codes.includes(this.code as ErrorCode)
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => null)) as ErrorEnvelope | null
    const requestId =
      body?.error?.requestId ?? res.headers.get('X-Request-Id') ?? undefined
    if (body?.error) {
      return new ApiError(
        res.status,
        body.error.code,
        body.error.message,
        requestId,
        body.error.details,
      )
    }
    return new ApiError(
      res.status,
      `HTTP_${res.status}`,
      res.statusText || 'Request failed',
      requestId,
    )
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError

/** Friendlier wording for codes whose API message is terse or technical. */
const FRIENDLY_MESSAGES: Partial<Record<string, string>> = {
  [ErrorCode.InvalidCredentials]: 'That email and password don’t match.',
  [ErrorCode.LinkExpired]:
    'This link has expired or was already used. Request a new one.',
  [ErrorCode.RateLimited]: 'Too many attempts. Wait a minute and try again.',
  [ErrorCode.NetworkError]:
    'Can’t reach SlotWise right now. Check your connection and try again.',
  [ErrorCode.ReauthenticationRequired]:
    'For your security, sign in again with an email link, then set your password within 15 minutes.',
  [ErrorCode.TenantSuspended]: 'This business is suspended.',
  [ErrorCode.Forbidden]: 'You don’t have permission to do that.',
  [ErrorCode.SocialSignInFailed]:
    'Sign-in with that provider didn’t complete. Please try again.',
  [ErrorCode.EmailNotVerified]:
    'That account’s email isn’t verified with the provider, so we can’t use it to sign you in.',
  [ErrorCode.AccountLinkRequired]:
    'An account with this email already exists. Sign in with an email link, then connect this provider from your account.',
  [ErrorCode.IdentityInUse]:
    'That account is already connected to a different SlotWise account.',
  [ErrorCode.ProviderAlreadyLinked]:
    'You already have a different account of this provider connected. Disconnect it first.',
}

/** A message that is safe and useful to show to the person. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === ErrorCode.ValidationFailed && error.details.length) {
      return error.details.join(' · ')
    }
    return FRIENDLY_MESSAGES[error.code] ?? error.message
  }
  return 'Something went wrong. Please try again.'
}
