import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { z } from "zod"
import { prisma } from "@/lib/db/client"
import { formatCheckinPayload } from "@/lib/demo/checkinPayload"
import { parseLocalDateOnly } from "@/lib/demo/dateOnly"

const BodySchema = z.object({
  centerId: z.string().min(1),
  memberName: z.string().min(1),
  memberFlat: z.string().optional(),
  memberId: z.string().optional(),
  /** ISO date string (date-only), e.g. 2026-04-09 */
  slotDate: z.string(),
  /** Hour bucket 5–21 (same convention as AmenityBooking) */
  slotHour: z.number().int().min(5).max(21),
})

function assertProxyAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.DEMO_MYGATE_PROXY_SECRET
  if (!secret) return null
  const header = req.headers.get("x-demo-secret")
  if (header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

/**
 * Demo “MyGate → CureFit” proxy: external system calls this after a resident books an amenity.
 * Persists AmenityBooking and returns a QR payload + SVG for the resident’s phone.
 * No real MyGate integration — use demo seed centers + this route for hackathon flows.
 */
export async function POST(req: NextRequest) {
  const unauthorized = assertProxyAuth(req)
  if (unauthorized) return unauthorized

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { centerId, memberName, memberFlat, memberId, slotDate, slotHour } = parsed.data
  const slot = parseLocalDateOnly(slotDate)
  if (!slot) {
    return NextResponse.json({ error: "Invalid slotDate (use YYYY-MM-DD)" }, { status: 400 })
  }

  const center = await prisma.center.findUnique({ where: { id: centerId } })
  if (!center) {
    return NextResponse.json({ error: "Unknown centerId" }, { status: 404 })
  }

  const booking = await prisma.amenityBooking.create({
    data: {
      centerId,
      memberName,
      memberFlat: memberFlat ?? null,
      memberId: memberId ?? null,
      slotDate: slot,
      slotHour,
      status: "BOOKED",
    },
  })

  const checkInPayload = formatCheckinPayload(booking.id)
  const qrSvg = await QRCode.toString(checkInPayload, { type: "svg", width: 280, margin: 1 })

  return NextResponse.json({
    bookingId: booking.id,
    centerId: booking.centerId,
    checkInPayload,
    qrSvg,
    /** Human-readable; kiosk can scan the same string as in the QR */
    message: "Return qrSvg to the resident app, or render checkInPayload as any QR generator.",
  })
}
