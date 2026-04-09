/**
 * Parse `YYYY-MM-DD` as a calendar date at local midnight (no UTC shift).
 * Avoids `new Date("2026-04-09")` + `setHours(0)` mixing UTC and local timezones.
 */
export function parseLocalDateOnly(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const y = Number(m[1])
  const month = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, month - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== month - 1 || dt.getDate() !== d) {
    return null
  }
  return dt
}
