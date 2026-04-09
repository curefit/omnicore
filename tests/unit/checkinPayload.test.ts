import { describe, expect, it } from "vitest"
import { formatCheckinPayload, parseCheckinPayload } from "@/lib/demo/checkinPayload"

/** 25-char Prisma-style cuid: c + 24 alphanumerics */
const SAMPLE_CUID = "c012345678901234567890123"

describe("parseCheckinPayload", () => {
  it("parses full payload", () => {
    expect(parseCheckinPayload(formatCheckinPayload(SAMPLE_CUID))).toBe(SAMPLE_CUID)
  })

  it("parses bare cuid", () => {
    expect(parseCheckinPayload(`  ${SAMPLE_CUID} `)).toBe(SAMPLE_CUID)
  })

  it("parses id from query string", () => {
    expect(parseCheckinPayload(`https://x.test/y?id=${SAMPLE_CUID}&z=1`)).toBe(SAMPLE_CUID)
  })

  it("returns null for garbage", () => {
    expect(parseCheckinPayload("not-a-token")).toBeNull()
  })

  it("rejects wrong-length ids", () => {
    expect(parseCheckinPayload("c0123456789012345678901")).toBeNull() // 23 chars — too short
    expect(parseCheckinPayload("c0123456789012345678901234")).toBeNull() // 26 chars — too long
  })
})
