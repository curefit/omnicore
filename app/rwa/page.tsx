import { FootfallCard } from "@/components/dashboard/FootfallCard"
import { BookingFeed } from "@/components/dashboard/BookingFeed"
import { TrainerAttendanceCard } from "@/components/dashboard/TrainerAttendanceCard"
import { prisma } from "@/lib/db/client"

export default async function RWADashboard() {
  const center = await prisma.center.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  })

  if (!center) {
    return (
      <div className="flex items-center justify-center h-64 text-[#6b7280]">
        No active center found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#e5e7eb]">{center.name}</h1>
        <p className="text-sm text-[#6b7280] mt-1">
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
