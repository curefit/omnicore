import { Building2, Users, Wrench, Ticket } from "lucide-react"
import { prisma } from "@/lib/db/client"
import { StatCard } from "@/components/shared/StatCard"
import { SectionHeader } from "@/components/shared/SectionHeader"

async function getStats() {
  const [activeCenters, mappedTrainers, trackedAssets, openRequests] =
    await Promise.all([
      prisma.center.count({ where: { status: "ACTIVE" } }),
      prisma.centerTrainerMapping.count({ where: { isActive: true } }),
      prisma.equipmentAsset.count(),
      prisma.serviceRequest.count({
        where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
      }),
    ])
  return { activeCenters, mappedTrainers, trackedAssets, openRequests }
}

export default async function CFAdminOverviewPage() {
  const stats = await getStats()

  return (
    <div className="p-8">
      <SectionHeader
        title="Operations Hub"
        description="Manage centers, trainers, assets, and service workflows across all facilities."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard
          label="Active Centers"
          value={stats.activeCenters}
          icon={Building2}
          accent="cyan"
        />
        <StatCard
          label="Mapped Trainers"
          value={stats.mappedTrainers}
          icon={Users}
          accent="purple"
        />
        <StatCard
          label="Assets Tracked"
          value={stats.trackedAssets}
          icon={Wrench}
          accent="emerald"
        />
        <StatCard
          label="Open Requests"
          value={stats.openRequests}
          icon={Ticket}
          accent="amber"
          description={stats.openRequests > 0 ? "needs attention" : "all clear"}
        />
      </div>

      <div className="rounded-xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-8 text-center">
        <p className="text-[#6b7280] text-sm">
          Center grid and detail views coming in Phase 3.
        </p>
      </div>
    </div>
  )
}
