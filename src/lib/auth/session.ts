import { API_URL } from '@/lib/env'

/** What sign-in, account setup and refresh answer with. */
export interface TokenResponse {
  accessToken: string
  tokenType: 'Bearer'
  /** Seconds. */
  expiresIn: number
}

interface Session {
  accessToken: string
  /** Epoch ms. */
  expiresAt: number
}

/**
 * The access token lives in memory only. The refresh token is the httpOnly
 * `sw_refresh` cookie (path /auth) that JavaScript never sees: a reload
 * restores the session with `POST /auth/refresh`.
 */
let session: Session | null = null

/** Refresh this long before the access token expires. */
const EXPIRY_SKEW_MS = 30_000

export function setSession(tokens: TokenResponse): void {
  session = {
    accessToken: tokens.accessToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  }
}

export function clearSession(): void {
  session = null
  // A later restore must not reuse the answer from before sign-out.
  restoreAttempt = Promise.resolve(false)
}

export const hasSession = (): boolean => session !== null

export const isSessionStale = (): boolean =>
  session !== null && session.expiresAt - Date.now() < EXPIRY_SKEW_MS

export const accessToken = (): string | null => session?.accessToken ?? null

let refreshing: Promise<boolean> | null = null

/**
 * Rotates the refresh cookie for a new access token. Single-flight within the
 * tab, and serialised across tabs with a Web Lock: the API revokes the whole
 * token family when a refresh token is presented twice, so two tabs must not
 * race with the same cookie.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= withRefreshLock(requestRefresh).finally(() => {
    refreshing = null
  })
  return refreshing
}

async function requestRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      session = null
      return false
    }
    setSession((await res.json()) as TokenResponse)
    return true
  } catch {
    // Offline or API down: keep whatever we had, report no fresh session.
    return false
  }
}

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request('slotwise:refresh', task)
  }
  return task()
}

let restoreAttempt: Promise<boolean> | null = null

/**
 * Resolves whether there is a usable session, trying the refresh cookie once
 * per page load. Route guards await this before anything else.
 */
export function restoreSession(): Promise<boolean> {
  if (session) return Promise.resolve(true)
  restoreAttempt ??= refreshSession()
  return restoreAttempt
}
