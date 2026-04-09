/** Demo/hackathon: opaque string encoded in the resident QR (not production MyGate). */
export const CHECKIN_PREFIX = "omnicore-checkin:"

/** Prisma `@default(cuid())` ids: `c` + 24 lowercase alphanumerics (25 chars total). */
const PRISMA_CUID = /^c[a-z0-9]{24}$/

export function formatCheckinPayload(bookingId: string): string {
  return `${CHECKIN_PREFIX}${bookingId}`
}

/** Accepts full payload, bare booking id (cuid), or pasted URL containing id= */
export function parseCheckinPayload(raw: string): string | null {
  const t = raw.trim()
  const fromPrefix = t.startsWith(CHECKIN_PREFIX) ? t.slice(CHECKIN_PREFIX.length).trim() : null
  if (fromPrefix && PRISMA_CUID.test(fromPrefix)) {
    return fromPrefix
  }
  if (PRISMA_CUID.test(t)) {
    return t
  }
  const idParam = t.match(/(?:[?&])id=([^&\s#]+)/)
  const decoded = idParam?.[1] ? decodeURIComponent(idParam[1]) : null
  if (decoded && PRISMA_CUID.test(decoded)) {
    return decoded
  }
  return null
}
