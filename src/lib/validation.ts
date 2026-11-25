import { z } from 'zod'

/**
 * Client-side rules mirroring the API's Zod schemas, so people see problems
 * before submitting. The API stays the authority (e.g. its breached-password
 * list); its answer is shown when it disagrees.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .pipe(z.email('Enter a valid email address').max(254))

/** Sign-in compares against the stored hash: any non-empty password. */
export const currentPasswordSchema = z.string().min(1, 'Enter your password')

export const PASSWORD_MIN_LENGTH = 10

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(1024, 'Use at most 1024 characters')

/** New password + confirmation, as a form-level object. */
export const setPasswordSchema = z
  .object({ password: newPasswordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords don’t match',
    path: ['confirm'],
  })

export const personNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(100, 'Use at most 100 characters')

export const businessNameSchema = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters')
  .max(100, 'Use at most 100 characters')

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'www', 'app', 'auth', 'public', 'static',
  'assets', 'docs', 'help', 'support', 'slotwise',
])

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]{3,40}$/, '3–40 lowercase letters, digits or hyphens')
  .refine((slug) => !RESERVED_SLUGS.has(slug), 'This address is reserved')

/** "Glow Salon & Spa" → "glow-salon-spa". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}

const PHONE_DIGITS = /^(?:\+?91)?([6-9]\d{9})$/

/**
 * Indian mobile numbers as people type them ("98765 43210", "+91-98765…")
 * → E.164 "+919876543210"; null when it isn't one.
 */
export function toE164(input: string): string | null {
  const match = PHONE_DIGITS.exec(input.replace(/[\s()-]/g, ''))
  return match ? `+91${match[1]}` : null
}

/** Optional phone: empty is fine, anything else must be an Indian mobile. */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || toE164(v) !== null, {
    message: 'Enter a 10-digit Indian mobile number',
  })

export const optionalText = (max: number) =>
  z.string().trim().max(max, `Use at most ${max} characters`)

/** "" → null for nullable API fields. */
export const emptyToNull = (value: string): string | null =>
  value.trim() === '' ? null : value.trim()

/** "" → undefined for optional API fields. */
export const emptyToUndefined = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim()

/** A same-app path ("/b/glow-salon"), never another origin. */
export function safeRedirectPath(value: string | undefined): string | undefined {
  return value && /^\/(?![/\\])\S*$/.test(value) ? value : undefined
}
