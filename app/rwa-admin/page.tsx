import { Activity, Users, Wrench, Ticket, Building2, MapPin } from "lucide-react"
import { prisma } from "@/lib/db/client"
import { StatCard } from "@/components/shared/StatCard"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { BillingCard } from "@/components/rwa/BillingCard"

async function getCenter() {
  return prisma.center.findFirst({
    where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
    include: {
      modules: { where: { isEnabled: true } },
      residentialDetails: true,
      lead: {
        include: {
          quote: {
            include: { lineItems: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getStats() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const [liveOccupancy, trainersIn, assetAlerts, openRequests] = await Promise.all([
    prisma.amenityBooking.count({
      where: { status: "BOOKED", slotDate: { gte: startOfDay, lt: endOfDay } },
    }),
    prisma.trainerAttendance.count({
      where: { date: { gte: startOfDay }, status: "PRESENT", checkIn: { not: null }, checkOut: null },
    }),
    prisma.equipmentAsset.count({ where: { condition: { in: ["FAIR", "POOR"] } } }),
    prisma.serviceRequest.count({ where: { status: { in: ["OPEN", "ASSIGNED"] } } }),
  ])

  return { liveOccupancy, trainersIn, assetAlerts, openRequests }
}

const MODULE_LABEL: Record<string, string> = {
  TRAINERS: "Trainers",
  ASSETS: "Assets",
  MYGATE: "MyGate",
  VENDING_MACHINES: "Vending",
  BRANDING: "Branding",
}

export default async function RWAAdminDashboardPage() {
  const [center, stats] = await Promise.all([getCenter(), getStats()])

  return (
    <div className="p-8 space-y-6">
      <SectionHeader
        title="Live Dashboard"
        description="Live footfall, trainer attendance, asset health, and facility status."
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide">
            READ ONLY
          </span>
        }
      />

      {/* Gym hero card — shown when center exists */}
      {center ? (
        <div className="rounded-2xl border border-[#1f2937] bg-[#111827] overflow-hidden">
          <div className="px-6 py-5 flex items-start gap-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#1f2937] border border-[#374151] shrink-0">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-white">{center.name}</h2>
                <StatusBadge status={center.status} showDot />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3 text-[#6b7280]" />
                <p className="text-xs text-[#6b7280]">{center.city} · {center.pincode}</p>
              </div>
              {center.residentialDetails && (
                <p className="text-xs text-[#6b7280] mt-0.5">
                  {center.residentialDetails.rwaName} · {center.residentialDetails.totalUnits.toLocaleString()} units
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {center.modules.map((m) => (
                  <span key={m.moduleKey} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {MODULE_LABEL[m.moduleKey] ?? m.moduleKey}
                  </span>
                ))}
              </div>
            </div>
            {center.gymSqFt && (
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-white font-mono-metric">{center.gymSqFt.toLocaleString()}</p>
                <p className="text-[11px] text-[#6b7280]">sq ft</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#1f2937] bg-[#111827]/50 px-5 py-4">
          <p className="text-sm text-[#6b7280]">
            Your gym setup is in progress. Once your quote is accepted, your gym details will appear here.
          </p>
        </div>
      )}

          {/* Billing card — shown when quote is accepted */}
      {center?.lead?.quote?.status === "ACCEPTED" && (
        <BillingCard
          quote={center.lead.quote}
          centerName={center.name}
        />
      )}

      {/* Live stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Booked Slots" value={stats.liveOccupancy} icon={Activity} accent="cyan" description="amenity bookings today" />
        <StatCard label="Trainers Active" value={stats.trainersIn} icon={Users} accent="emerald" />
        <StatCard label="Asset Alerts" value={stats.assetAlerts} icon={Wrench} accent={stats.assetAlerts > 0 ? "amber" : "emerald"} description={stats.assetAlerts > 0 ? "fair or poor condition" : "all green"} />
        <StatCard label="Open Requests" value={stats.openRequests} icon={Ticket} accent={stats.openRequests > 0 ? "red" : "emerald"} description={stats.openRequests > 0 ? "needs attention" : "all clear"} />
      </div>

      <div className="rounded-xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-8 text-center">
        <p className="text-[#6b7280] text-sm">
          Live footfall feed, trainer table, and asset widgets coming in Phase 4.
        </p>
      </div>
    </div>
  )
}
