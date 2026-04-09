import { prisma } from "@/lib/db/client"

interface Props {
  centerId: string
}

export async function TrainerAttendanceCard({ centerId }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDay = new Date(today)
  nextDay.setDate(nextDay.getDate() + 1)

  const records = await prisma.trainerAttendance.findMany({
    where: { centerId, date: { gte: today, lt: nextDay } },
    include: { trainer: { select: { name: true, trainerType: true } } },
    orderBy: { checkIn: "asc" },
  })

  const present = records.filter((r) => r.status === "PRESENT").length
  const absent = records.filter((r) => r.status === "ABSENT").length
  const late = records.filter((r) => r.status === "LATE").length

  const formatTime = (dt: Date | null) => {
    if (!dt) return "—"
    return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const statusStyle: Record<string, string> = {
    PRESENT: "text-emerald-400 bg-emerald-500/10",
    ABSENT: "text-red-400 bg-red-500/10",
    LATE: "text-amber-400 bg-amber-500/10",
  }

  return (
    <div className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-oc-fg-soft">Trainer Attendance</p>
        <p className="text-xs text-oc-fg-dim">Today</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 text-center bg-emerald-500/5 border border-emerald-500/20 rounded-lg py-2">
          <p className="text-lg font-semibold text-emerald-400">{present}</p>
          <p className="text-xs text-oc-fg-dim">Present</p>
        </div>
        <div className="flex-1 text-center bg-amber-500/5 border border-amber-500/20 rounded-lg py-2">
          <p className="text-lg font-semibold text-amber-400">{late}</p>
          <p className="text-xs text-oc-fg-dim">Late</p>
        </div>
        <div className="flex-1 text-center bg-red-500/5 border border-red-500/20 rounded-lg py-2">
          <p className="text-lg font-semibold text-red-400">{absent}</p>
          <p className="text-xs text-oc-fg-dim">Absent</p>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-oc-fg-dim text-center py-2">No attendance records today</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-oc-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-oc-border flex items-center justify-center text-xs text-oc-fg-muted font-medium flex-shrink-0">
                  {r.trainer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-oc-fg-soft">{r.trainer.name}</p>
                  <p className="text-xs text-oc-fg-dim">
                    {r.checkIn ? `In ${formatTime(r.checkIn)}` : "Not checked in"}
                    {r.checkOut ? ` · Out ${formatTime(r.checkOut)}` : ""}
                    {" · "}{r.source}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[r.status] ?? "text-oc-fg-dim"}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
