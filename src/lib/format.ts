/**
 * The API stores and returns UTC only; the browser owns conversion to local
 * time (backend docs/roadmap.md, "Local-time bugs").
 */
const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso))

export const formatDateTime = (iso: string): string =>
  dateTimeFormat.format(new Date(iso))

/** "+919876543210" → "+91 98765 43210". */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return ''
  const match = /^\+91(\d{5})(\d{5})$/.exec(e164)
  return match ? `+91 ${match[1]} ${match[2]}` : e164
}

/** "Asha Patel" → "AP". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

/** The public booking page of a business. */
export const publicPagePath = (slug: string) => `/b/${slug}`
