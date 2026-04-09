import { describe, expect, it } from "vitest"
import { generateCenterCode } from "@/lib/centers/code"

describe("generateCenterCode", () => {
  it("builds initials from words", () => {
    const code = generateCenterCode("Godrej Emerald Gym")
    expect(code).toMatch(/^GEG-[0-9A-F]{4}$/)
  })

  it("skips numeric-only words and uses first alphabetic word for an initial", () => {
    const code = generateCenterCode("123 456 Society")
    expect(code).toMatch(/^S-[0-9A-F]{4}$/)
  })

  it("falls back to GYM when no letters at all", () => {
    const code = generateCenterCode("123 456")
    expect(code).toMatch(/^GYM-[0-9A-F]{4}$/)
  })

  it("handles empty string", () => {
    const code = generateCenterCode("   ")
    expect(code).toMatch(/^GYM-[0-9A-F]{4}$/)
  })
})
