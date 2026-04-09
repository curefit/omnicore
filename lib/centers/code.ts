import { randomBytes } from "crypto"

/**
 * Derives a short center code from a society/gym name.
 * Takes the initial letter of each word (up to 4) and appends a random 4-char suffix.
 * e.g. "Godrej Emerald Gym" → "GEG-3K7P"
 */
export function generateCenterCode(name: string): string {
  const trimmed = name.trim()
  const words = trimmed.split(/\s+/).filter(Boolean)

  const fromWords = words
    .slice(0, 4)
    .map((w) => {
      const m = w.match(/[A-Za-z]/)
      return m ? m[0].toUpperCase() : ""
    })
    .join("")

  const lettersOnly = trimmed.match(/[A-Za-z]/g)
  const prefix =
    fromWords ||
    (lettersOnly ? lettersOnly.slice(0, 4).join("").toUpperCase() : "") ||
    "GYM"

  const suffix = randomBytes(2).toString("hex").toUpperCase()
  return `${prefix}-${suffix}`
}
