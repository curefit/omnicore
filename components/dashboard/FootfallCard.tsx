import { prisma } from "@/lib/db/client"

interface Props {
  centerId: string
}

export async function FootfallCard({ centerId }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDay = new Date(today)
  nextDay.setDate(nextDay.getDate() + 1)

  const bookings = await prisma.amenityBooking.findMany({
    where: { centerId, slotDate: { gte: today, lt: nextDay }, status: "BOOKED" },
    orderBy: { slotHour: "asc" },
  })

  const hourMap: Record<number, number> = {}
  for (const b of bookings) {
    hourMap[b.slotHour] = (hourMap[b.slotHour] ?? 0) + 1
  }

  const hourLabel = (h: number) => {
    const suffix = h >= 12 ? "pm" : "am"
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${display}${suffix}`
  }

  const slots = Array.from({ length: 17 }, (_, i) => i + 5).map((h) => ({
    hour: h,
    label: hourLabel(h),
    count: hourMap[h] ?? 0,
  }))

  const maxCount = Math.max(...slots.map((s) => s.count), 1)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayCount = await prisma.amenityBooking.count({
    where: { centerId, slotDate: { gte: yesterday, lt: today }, status: "BOOKED" },
  })

  const delta = bookings.length - yesterdayCount
  const deltaSign = delta >= 0 ? "+" : ""

  return (
    <div className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-oc-fg-dim uppercase tracking-wider">Today&apos;s Footfall</p>
          <p className="text-3xl font-semibold text-oc-fg-soft mt-1">{bookings.length}</p>
          <p className="text-xs text-oc-fg-dim mt-1">
            <span className={delta >= 0 ? "text-emerald-400" : "text-red-400"}>
              {deltaSign}{delta}
            </span>
            {" vs yesterday"}
          </p>
        </div>
        <div className="text-xs text-oc-fg-dim">Gym bookings</div>
      </div>

      <div>
        <p className="text-xs text-oc-fg-dim mb-3">Bookings by hour</p>
        <div className="flex items-end gap-1 h-20">
          {slots.map((slot) => {
            const heightPct = maxCount > 0 ? (slot.count / maxCount) * 100 : 0
            const isCurrentHour = slot.hour === new Date().getHours()
            return (
              <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${
                    isCurrentHour
                      ? "bg-[#f97316]"
                      : slot.count > 0
                      ? "bg-[#f97316]/40"
                      : "bg-oc-border"
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                {slot.count > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-oc-border text-oc-fg-soft text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {slot.count}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {slots.map((slot, i) => (
            <div key={slot.hour} className="flex-1 text-center">
              {i % 3 === 0 && (
                <span className="text-[10px] text-oc-placeholder">{slot.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
