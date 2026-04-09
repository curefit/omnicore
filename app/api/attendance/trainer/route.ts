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

    const records = await prisma.trainerAttendance.findMany({
      where: {
        centerId,
        date: { gte: targetDate, lt: nextDay },
      },
      include: {
        trainer: { select: { id: true, name: true, trainerType: true } },
      },
      orderBy: { checkIn: "asc" },
    })

    const trainers = records.map((r) => {
      const hoursWorked =
        r.checkIn && r.checkOut
          ? Math.round(
              ((r.checkOut.getTime() - r.checkIn.getTime()) / 3600000) * 100
            ) / 100
          : null

      return {
        trainerId: r.trainerId,
        trainerName: r.trainer.name,
        trainerType: r.trainer.trainerType,
        status: r.status,
        source: r.source,
        checkIn: r.checkIn?.toISOString() ?? null,
        checkOut: r.checkOut?.toISOString() ?? null,
        hoursWorked,
      }
    })

    const summary = {
      total: trainers.length,
      present: trainers.filter((t) => t.status === "PRESENT").length,
      absent: trainers.filter((t) => t.status === "ABSENT").length,
      late: trainers.filter((t) => t.status === "LATE").length,
    }

    return NextResponse.json({
      date: targetDate.toISOString().split("T")[0],
      summary,
      trainers,
    })
  } catch (err) {
    console.error("Trainer attendance fetch error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
