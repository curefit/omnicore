import { randomBytes } from "crypto"

/**
 * Derives a short center code from a society/gym name.
 * Takes the initial letter of each word (up to 4) and appends a random 4-char suffix.
 * e.g. "Godrej Emerald Gym" → "GEG-3K7P"
 */
export function generateCenterCode(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w[0].toUpperCase())
    .join("")

  const suffix = randomBytes(2).toString("hex").toUpperCase()
  return `${initials}-${suffix}`
}
