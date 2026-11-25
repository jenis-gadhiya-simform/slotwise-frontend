import {
  accessToken,
  clearSession,
  hasSession,
  isSessionStale,
  refreshSession,
} from '@/lib/auth/session'
import { API_URL } from '@/lib/env'
import { ApiError, ErrorCode } from './errors'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: Method
  body?: unknown
  query?: Record<string, QueryValue>
  /** The business to act in (`X-Tenant-Id`), for tenant-scoped endpoints. */
  tenantId?: string
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = accessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.tenantId) headers.set('X-Tenant-Id', options.tenantId)
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      // The refresh cookie is scoped to /auth; other routes just ignore it.
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      0,
      ErrorCode.NetworkError,
      'Cannot reach the SlotWise API',
    )
  }
}

/**
 * Calls the SlotWise API. Attaches the access token, refreshes it shortly
 * before it expires, and retries once after a 401 with a fresh one. Errors
 * are thrown as `ApiError` carrying the API's stable `code`.
 */
export async function api<T = void>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (isSessionStale()) await refreshSession()

  const hadSession = hasSession()
  let res = await send(path, options)

  if (res.status === 401 && hadSession) {
    if (await refreshSession()) {
      res = await send(path, options)
    } else {
      clearSession()
    }
  }

  if (!res.ok) throw await ApiError.fromResponse(res)
  if (res.status === 204 || res.headers.get('Content-Length') === '0') {
    return undefined as T
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
