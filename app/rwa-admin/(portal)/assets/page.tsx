import { prisma } from "@/lib/db/client"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { UpgradeAdCard } from "@/components/equipment/UpgradeAdCard"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import { Clock, AlertCircle, CheckCircle2, Ticket, Wrench } from "lucide-react"
import { OmniMascot } from "@/components/shared/OmniMascot"

function getDaysUntil(date: Date | null): number | null {
  if (!date) return null
  return Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function MaintenanceTimer({ nextServiceDue }: { nextServiceDue: Date | null }) {
  const days = getDaysUntil(nextServiceDue)
  if (days === null) return <span className="text-[11px] text-oc-fg-dim">No schedule</span>

  if (days < 0) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 animate-pulse">
        <AlertCircle className="w-3 h-3" />
        Overdue by {Math.abs(days)}d
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
        <Clock className="w-3 h-3" />
        Due in {days}d
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
        <Clock className="w-3 h-3" />
        Due in {days}d
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
      <CheckCircle2 className="w-3 h-3" />
      Due in {days}d
    </span>
  )
}

export default async function RWAAdminAssetsPage() {
  // For demo: get the most recent center that has assets
  const center = await prisma.center.findFirst({
    where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
    include: { equipmentAssets: { include: { serviceRequests: { where: { status: { in: ["OPEN", "ASSIGNED"] } } } } } },
    orderBy: { createdAt: "desc" },
  })

  if (!center || center.equipmentAssets.length === 0) {
    return (
      <div className="p-8">
        <SectionHeader
          title="Assets"
          description="Equipment installed at your gym facility."
          badge={<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">READ ONLY</span>}
        />
        <div className="rounded-xl border border-dashed border-oc-border p-12 flex flex-col items-center text-center mt-6 gap-2">
          <OmniMascot variant="empty" size="lg" />
          <p className="text-sm font-medium text-oc-fg-muted">No equipment installed yet</p>
          <p className="text-xs text-oc-fg-dim">Equipment will appear here after your quote is accepted.</p>
        </div>
      </div>
    )
  }

  // Fetch catalog items for upgrade check (only for assets with catalogItemSku)
  const skus = center.equipmentAssets.map((a) => a.catalogItemSku).filter((s): s is string => !!s)
  const catalogItems = skus.length > 0
    ? await prisma.equipmentCatalogItem.findMany({ where: { sku: { in: skus } } })
    : []
  const catalogMap = new Map(catalogItems.map((c) => [c.sku, c]))

  // Fetch newer items for upgrade ads
  const supersedingSkus = catalogItems.filter((c) => !c.isLatestVersion && c.supersedesSku).map((c) => c.supersedesSku!)
  const newerItems = supersedingSkus.length > 0
    ? await prisma.equipmentCatalogItem.findMany({ where: { sku: { in: supersedingSkus } } })
    : []
  const newerItemMap = new Map(newerItems.map((n) => [n.sku, n]))

  // Group by category
  const grouped = new Map<string, typeof center.equipmentAssets>()
  for (const asset of center.equipmentAssets) {
    const cat = asset.category
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(asset)
  }

  const totalAssets = center.equipmentAssets.length
  const overdueCount = center.equipmentAssets.filter((a) => getDaysUntil(a.nextServiceDue) !== null && getDaysUntil(a.nextServiceDue)! < 0).length
  const openSRCount = center.equipmentAssets.reduce((s, a) => s + a.serviceRequests.length, 0)

  return (
    <div className="p-8 space-y-6">
      <SectionHeader
        title="Assets"
        description={`Equipment at ${center.name}`}
        badge={<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">READ ONLY</span>}
      />

      {/* Overdue alert banner with mascot */}
      {overdueCount > 0 && (
        <div className="relative flex items-center gap-5 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 overflow-hidden">
          <OmniMascot variant="alert" size="md" className="shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">
              {overdueCount} equipment item{overdueCount !== 1 ? "s" : ""} overdue for maintenance
            </p>
            <p className="text-xs text-oc-fg-dim mt-0.5">
              Please raise a service request or contact CultSport support.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-oc-border bg-oc-card px-4 py-3 text-center">
          <p className="text-2xl font-bold text-oc-fg">{totalAssets}</p>
          <p className="text-xs text-oc-fg-dim mt-0.5">Total Equipment</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 text-center ${overdueCount > 0 ? "border-red-500/20 bg-red-500/5" : "border-oc-border bg-oc-card"}`}>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-400" : "text-oc-fg"}`}>{overdueCount}</p>
          <p className="text-xs text-oc-fg-dim mt-0.5">Maintenance Overdue</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 text-center ${openSRCount > 0 ? "border-amber-500/20 bg-amber-500/5" : "border-oc-border bg-oc-card"}`}>
          <p className={`text-2xl font-bold ${openSRCount > 0 ? "text-amber-400" : "text-oc-fg"}`}>{openSRCount}</p>
          <p className="text-xs text-oc-fg-dim mt-0.5">Open Tickets</p>
        </div>
      </div>

      {/* Asset cards grouped by category */}
      <div className="space-y-5">
        {Array.from(grouped.entries()).map(([category, assets]) => {
          const catItem = assets[0]
          const heroImage = catItem.catalogItemSku
            ? catalogMap.get(catItem.catalogItemSku)?.imageUrl
            : null
          const displayName = CATEGORY_DISPLAY_NAMES[category] ?? category

          return (
            <div key={category} className="rounded-2xl border border-oc-border overflow-hidden">
              {/* Category header — cinematic hero */}
              <div className="relative h-32 overflow-hidden bg-oc-deep">
                {heroImage && (
                  <img src={heroImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center opacity-20" />
                )}
                <div className="hero-overlay-h" />
                <div className="hero-overlay-v" />
                <div className="absolute inset-0 flex items-end px-5 pb-4 gap-3">
                  <Wrench className="w-4 h-4 text-cyan-400 shrink-0 mb-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-oc-fg">{displayName}</h3>
                    <p className="text-[11px] text-oc-fg-dim">{assets.length} unit{assets.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {/* Individual assets */}
              <div className="divide-y divide-oc-divide bg-oc-base">
                {assets.map((asset) => {
                  const catalogItem = asset.catalogItemSku ? catalogMap.get(asset.catalogItemSku) : null
                  const hasUpgrade = catalogItem && !catalogItem.isLatestVersion && catalogItem.supersedesSku
                  const newerItem = hasUpgrade ? newerItemMap.get(catalogItem.supersedesSku!) : null
                  const openSRs = asset.serviceRequests.length

                  return (
                    <div key={asset.id} className="relative px-5 py-4 space-y-2 overflow-hidden">
                      <div className="flex items-start gap-4">
                        {/* Edge-bleed image instead of boxed thumbnail */}
                        {catalogItem?.imageUrl && (
                          <div
                            className="absolute left-0 top-0 w-32 h-full opacity-20 pointer-events-none"
                            style={{
                              backgroundImage: `url(${catalogItem.imageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              maskImage: "linear-gradient(to right, transparent, black 50%, transparent)",
                              WebkitMaskImage: "linear-gradient(to right, transparent, black 50%, transparent)",
                            }}
                          />
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-oc-fg truncate">{asset.name}</p>
                          <p className="text-[11px] text-oc-fg-dim font-mono">{asset.catalogItemSku ?? asset.model ?? "—"}</p>
                          {asset.installationDate && (
                            <p className="text-[11px] text-oc-placeholder mt-0.5">
                              Installed {new Date(asset.installationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>

                        {/* Maintenance timer + SR badge */}
                        <div className="text-right shrink-0 space-y-1">
                          <MaintenanceTimer nextServiceDue={asset.nextServiceDue} />
                          {openSRs > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-400 justify-end">
                              <Ticket className="w-3 h-3" />
                              {openSRs} open ticket{openSRs !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Upgrade ad if applicable */}
                      {hasUpgrade && newerItem && (
                        <UpgradeAdCard
                          currentSku={asset.catalogItemSku!}
                          currentName={asset.name}
                          newItem={newerItem}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
