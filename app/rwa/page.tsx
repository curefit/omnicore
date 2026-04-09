import { FootfallCard } from "@/components/dashboard/FootfallCard"
import { BookingFeed } from "@/components/dashboard/BookingFeed"
import { TrainerAttendanceCard } from "@/components/dashboard/TrainerAttendanceCard"
import { prisma } from "@/lib/db/client"
import { OmniMascot } from "@/components/shared/OmniMascot"

export default async function RWADashboard() {
  const center = await prisma.center.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  })

  if (!center) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <OmniMascot variant="empty" size="lg" />
        <p className="text-sm text-oc-fg-muted">No active center found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">{center.name}</h1>
        <p className="text-sm text-oc-fg-dim mt-1">
          Resident dashboard —{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FootfallCard centerId={center.id} />
        <TrainerAttendanceCard centerId={center.id} />
      </div>

      <BookingFeed centerId={center.id} />
    </div>
  )
}
