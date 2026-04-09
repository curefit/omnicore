import { describe, expect, it } from "vitest"
import { parseLocalDateOnly } from "@/lib/demo/dateOnly"

describe("parseLocalDateOnly", () => {
  it("parses YYYY-MM-DD at local midnight", () => {
    const d = parseLocalDateOnly("2026-04-09")
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2026)
    expect(d!.getMonth()).toBe(3)
    expect(d!.getDate()).toBe(9)
    expect(d!.getHours()).toBe(0)
  })

  it("rejects invalid dates", () => {
    expect(parseLocalDateOnly("2026-02-30")).toBeNull()
    expect(parseLocalDateOnly("not-a-date")).toBeNull()
  })
})
