/** Base URL of the SlotWise API, without a trailing slash. */
export const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

/** Mailpit inbox for emailed links in local development. */
export const MAILPIT_URL = 'http://localhost:8025'
