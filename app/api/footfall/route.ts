import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const centerId = searchParams.get("centerId")
    if (!centerId) {
      return NextResponse.json({ error: "centerId is required" }, { status: 400 })
    }

    const dateParam = searchParams.get("date")
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const bookings = await prisma.amenityBooking.findMany({
      where: {
        centerId,
        slotDate: { gte: targetDate, lt: nextDay },
        status: "BOOKED",
      },
      orderBy: { slotHour: "asc" },
    })

    // Group by hour
    const hourMap: Record<number, number> = {}
    for (const b of bookings) {
      hourMap[b.slotHour] = (hourMap[b.slotHour] ?? 0) + 1
    }

    // Build byHour array for hours 5–21
    const hourLabel = (h: number) => {
      const suffix = h >= 12 ? "pm" : "am"
      const display = h > 12 ? h - 12 : h === 0 ? 12 : h
      return `${display}${suffix}`
    }

    const byHour = Array.from({ length: 17 }, (_, i) => i + 5).map((h) => ({
      hour: h,
      label: hourLabel(h),
      count: hourMap[h] ?? 0,
    }))

    // Recent bookings (last 10, ordered by bookedAt desc)
    const recent = await prisma.amenityBooking.findMany({
      where: {
        centerId,
        slotDate: { gte: targetDate, lt: nextDay },
        status: "BOOKED",
      },
      orderBy: { bookedAt: "desc" },
      take: 10,
    })

    const recentBookings = recent.map((b) => ({
      memberName: b.memberName,
      memberFlat: b.memberFlat,
      slotHour: b.slotHour,
      label: hourLabel(b.slotHour),
      bookedAt: b.bookedAt.toISOString(),
    }))

    return NextResponse.json({
      date: targetDate.toISOString().split("T")[0],
      totalBookings: bookings.length,
      byHour,
      recentBookings,
    })
  } catch (err) {
    console.error("Footfall fetch error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
