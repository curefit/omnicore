import Link from "next/link"
import { prisma } from "@/lib/db/client"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus, Building2, ChevronRight } from "lucide-react"

async function getCenters() {
  return prisma.center.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      residentialDetails: true,
      modules: true,
      _count: { select: { trainerMappings: true, equipmentAssets: true } },
    },
  })
}

export default async function OnboardingIndexPage() {
  const centers = await getCenters()

  return (
    <div className="p-8">
      <SectionHeader
        title="Center Onboarding"
        description="Manage center setup and module configuration."
        action={
          <Link href="/cf-admin/onboarding/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Center
            </Button>
          </Link>
        }
      />

      {centers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-oc-border p-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-oc-border border border-oc-muted mx-auto mb-4">
            <Building2 className="w-6 h-6 text-oc-fg-dim" />
          </div>
          <p className="text-sm font-medium text-oc-fg mb-1">No centers yet</p>
          <p className="text-xs text-oc-fg-dim mb-5">Get started by onboarding your first gym facility.</p>
          <Link href="/cf-admin/onboarding/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Onboard First Center
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {centers.map((center) => (
            <div
              key={center.id}
              className="flex items-center justify-between rounded-xl border border-oc-border bg-oc-card px-5 py-4 hover:bg-oc-hover hover:border-oc-muted transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-oc-border border border-oc-muted shrink-0">
                  <Building2 className="w-4 h-4 text-oc-fg-dim" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-sm font-semibold text-oc-fg truncate">{center.name}</p>
                    <StatusBadge status={center.status} showDot />
                  </div>
                  <p className="text-xs text-oc-fg-dim mt-0.5">
                    {center.city} · {center.capacity} capacity ·{" "}
                    {center.modules.filter((m) => m.isEnabled).length} modules ·{" "}
                    {center._count.trainerMappings} trainers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex gap-1.5">
                  {center.modules
                    .filter((m) => m.isEnabled)
                    .slice(0, 3)
                    .map((m) => (
                      <span
                        key={m.moduleKey}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-oc-border text-oc-fg-dim border border-oc-muted"
                      >
                        {m.moduleKey}
                      </span>
                    ))}
                  {center.modules.filter((m) => m.isEnabled).length > 3 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-oc-border text-oc-fg-dim border border-oc-muted">
                      +{center.modules.filter((m) => m.isEnabled).length - 3}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-oc-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
