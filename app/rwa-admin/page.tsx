import { Activity, Users, Wrench, Ticket } from "lucide-react"
import { prisma } from "@/lib/db/client"
import { StatCard } from "@/components/shared/StatCard"
import { SectionHeader } from "@/components/shared/SectionHeader"

async function getStats() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const [liveOccupancy, trainersIn, assetAlerts, openRequests] =
    await Promise.all([
      // Today's booked amenity slots (slot-based footfall)
      prisma.amenityBooking.count({
        where: {
          status: "BOOKED",
          slotDate: { gte: startOfDay, lt: endOfDay },
        },
      }),
      // Trainers who checked in today and haven't checked out
      prisma.trainerAttendance.count({
        where: {
          date: { gte: startOfDay },
          status: "PRESENT",
          checkIn: { not: null },
          checkOut: null,
        },
      }),
      // Assets that are FAIR or POOR
      prisma.equipmentAsset.count({
        where: { condition: { in: ["FAIR", "POOR"] } },
      }),
      // Open service requests
      prisma.serviceRequest.count({
        where: { status: { in: ["OPEN", "ASSIGNED"] } },
      }),
    ])

  return { liveOccupancy, trainersIn, assetAlerts, openRequests }
}

export default async function RWAAdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="p-8">
      <SectionHeader
        title="Live Dashboard"
        description="Live footfall, trainer attendance, asset health, and facility status."
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide">
            READ ONLY
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard
          label="Booked Slots"
          value={stats.liveOccupancy}
          icon={Activity}
          accent="cyan"
          description="amenity bookings today"
        />
        <StatCard
          label="Trainers Active"
          value={stats.trainersIn}
          icon={Users}
          accent="emerald"
        />
        <StatCard
          label="Asset Alerts"
          value={stats.assetAlerts}
          icon={Wrench}
          accent={stats.assetAlerts > 0 ? "amber" : "emerald"}
          description={stats.assetAlerts > 0 ? "fair or poor condition" : "all green"}
        />
        <StatCard
          label="Open Requests"
          value={stats.openRequests}
          icon={Ticket}
          accent={stats.openRequests > 0 ? "red" : "emerald"}
          description={stats.openRequests > 0 ? "needs attention" : "all clear"}
        />
      </div>

      <div className="rounded-xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-8 text-center">
        <p className="text-[#6b7280] text-sm">
          Live footfall feed, trainer table, and asset widgets coming in Phase 4.
        </p>
      </div>
    </div>
  )
}
