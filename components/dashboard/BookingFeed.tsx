import { prisma } from "@/lib/db/client"

interface Props {
  centerId: string
}

export async function BookingFeed({ centerId }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDay = new Date(today)
  nextDay.setDate(nextDay.getDate() + 1)

  const bookings = await prisma.amenityBooking.findMany({
    where: { centerId, slotDate: { gte: today, lt: nextDay }, status: "BOOKED" },
    orderBy: { bookedAt: "desc" },
    take: 12,
  })

  const hourLabel = (h: number) => {
    const suffix = h >= 12 ? "pm" : "am"
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h
    const nextH = h + 1
    const nextDisplay = nextH > 12 ? nextH - 12 : nextH === 0 ? 12 : nextH
    const nextSuffix = nextH >= 12 ? "pm" : "am"
    return `${display}${suffix}–${nextDisplay}${nextSuffix}`
  }

  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#e5e7eb]">Today&apos;s Bookings</p>
        <span className="text-xs text-[#6b7280]">{bookings.length} booked</span>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-[#6b7280] text-center py-4">No bookings yet today</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#1f2937] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1f2937] flex items-center justify-center text-xs text-[#9ca3af] font-medium flex-shrink-0">
                  {b.memberName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-[#e5e7eb]">{b.memberName}</p>
                  {b.memberFlat && (
                    <p className="text-xs text-[#6b7280]">{b.memberFlat}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#f97316]/80 bg-[#f97316]/10 px-2 py-0.5 rounded">
                {hourLabel(b.slotHour)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
