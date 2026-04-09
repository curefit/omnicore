import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { getAmenityUtilizationForCenter } from "@/lib/amenity/utilization"
import { AmenityUtilizationMetrics } from "@/components/amenity/AmenityUtilizationMetrics"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import { UpgradeAdCard } from "@/components/equipment/UpgradeAdCard"
import { BillingCard } from "@/components/rwa/BillingCard"
import { QuoteHistoryTimeline } from "@/components/leads/QuoteHistoryTimeline"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { StatCard } from "@/components/shared/StatCard"
import Link from "next/link"
import {
  Building2, MapPin, Wrench, Clock, AlertCircle, CheckCircle2,
  Ticket, Users, Activity, ChevronLeft, ExternalLink,
} from "lucide-react"

function getDaysUntil(date: Date | null) {
  if (!date) return null
  return Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function MaintenanceTimer({ nextServiceDue }: { nextServiceDue: Date | null }) {
  const days = getDaysUntil(nextServiceDue)
  if (days === null) return <span className="text-[11px] text-oc-fg-dim">No schedule</span>
  if (days < 0) return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 animate-pulse">
      <AlertCircle className="w-3 h-3" />Overdue {Math.abs(days)}d
    </span>
  )
  if (days <= 7) return <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400"><Clock className="w-3 h-3" />{days}d</span>
  if (days <= 30) return <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400"><Clock className="w-3 h-3" />{days}d</span>
  return <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle2 className="w-3 h-3" />{days}d</span>
}

const MODULE_LABEL: Record<string, string> = {
  TRAINERS: "Trainers", ASSETS: "Assets", MYGATE: "MyGate",
  VENDING_MACHINES: "Vending", BRANDING: "Branding",
}

interface Props {
  params: Promise<{ centerId: string }>
}

export default async function CFAdminCenterDetailPage({ params }: Props) {
  const { centerId } = await params

  const center = await prisma.center.findUnique({
    where: { id: centerId },
    include: {
      residentialDetails: true,
      modules: { where: { isEnabled: true } },
      equipmentAssets: {
        include: { serviceRequests: { where: { status: { in: ["OPEN", "ASSIGNED"] } } } },
      },
      lead: { include: { quote: { include: { lineItems: true } } } },
      trainerMappings: { where: { isActive: true }, include: { trainer: true } },
    },
  })

  if (!center) notFound()

  // Catalog items for upgrade check
  const skus = center.equipmentAssets.map((a) => a.catalogItemSku).filter((s): s is string => !!s)
  const catalogItems = skus.length > 0
    ? await prisma.equipmentCatalogItem.findMany({ where: { sku: { in: skus } } })
    : []
  const catalogMap = new Map(catalogItems.map((c) => [c.sku, c]))

  const supersedingSkus = catalogItems.filter((c) => !c.isLatestVersion && c.supersedesSku).map((c) => c.supersedesSku!)
  const newerItems = supersedingSkus.length > 0
    ? await prisma.equipmentCatalogItem.findMany({ where: { sku: { in: supersedingSkus } } })
    : []
  const newerItemMap = new Map(newerItems.map((n) => [n.sku, n]))

  // Stats
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1)

  const [bookings, trainersIn, openSRs, amenityUtilization] = await Promise.all([
    prisma.amenityBooking.count({ where: { centerId, status: "BOOKED", slotDate: { gte: startOfDay, lt: endOfDay } } }),
    prisma.trainerAttendance.count({ where: { centerId, date: { gte: startOfDay }, status: "PRESENT", checkIn: { not: null }, checkOut: null } }),
    prisma.serviceRequest.count({ where: { centerId, status: { in: ["OPEN", "ASSIGNED"] } } }),
    getAmenityUtilizationForCenter(centerId),
  ])

  const overdueAssets = center.equipmentAssets.filter(
    (a) => getDaysUntil(a.nextServiceDue) !== null && getDaysUntil(a.nextServiceDue)! < 0
  ).length

  // Group assets by category
  const grouped = new Map<string, typeof center.equipmentAssets>()
  for (const asset of center.equipmentAssets) {
    if (!grouped.has(asset.category)) grouped.set(asset.category, [])
    grouped.get(asset.category)!.push(asset)
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <Link href="/cf-admin" className="flex items-center gap-1.5 text-sm text-oc-fg-dim hover:text-oc-fg-soft transition-colors">
          <ChevronLeft className="w-4 h-4" />Back to Overview
        </Link>
        <span className="text-oc-muted">/</span>
        <span className="text-sm text-oc-fg-soft">{center.name}</span>
        {center.lead && (
          <Link href={`/cf-admin/leads/${center.lead.id}`}
            className="ml-auto flex items-center gap-1.5 text-xs text-[#f97316] hover:text-[#ea6c0c] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />Lead & Quote
          </Link>
        )}
      </div>

      {/* Center hero */}
      <div className="rounded-2xl border border-oc-border bg-oc-card overflow-hidden">
        <div className="px-6 py-5 flex items-start gap-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-oc-border border border-oc-muted shrink-0">
            <Building2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-oc-fg">{center.name}</h1>
              <StatusBadge status={center.status} showDot />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3 h-3 text-oc-fg-dim" />
              <p className="text-xs text-oc-fg-dim">{center.address}, {center.city} — {center.pincode}</p>
            </div>
            {center.residentialDetails && (
              <p className="text-xs text-oc-fg-dim mt-0.5">
                {center.residentialDetails.rwaName} · {center.residentialDetails.totalUnits.toLocaleString()} units ·{" "}
                Contact: {center.residentialDetails.contactPersonName}
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
              <p className="text-2xl font-bold text-oc-fg font-mono-metric">{center.gymSqFt.toLocaleString()}</p>
              <p className="text-[11px] text-oc-fg-dim">sq ft</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing card */}
      {center.lead?.quote?.status === "ACCEPTED" && (
        <BillingCard quote={center.lead.quote} centerName={center.name} />
      )}

      {/* Live stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bookings Today" value={bookings} icon={Activity} accent="cyan" description="Amenity slots · local calendar day" />
        <StatCard
          label="Trainers on floor"
          value={trainersIn}
          icon={Users}
          accent="emerald"
          description="Today · checked in, not clocked out"
        />
        <StatCard label="Asset Alerts" value={overdueAssets} icon={Wrench} accent={overdueAssets > 0 ? "amber" : "emerald"} />
        <StatCard label="Open Tickets" value={openSRs} icon={Ticket} accent={openSRs > 0 ? "red" : "emerald"} />
      </div>

      <AmenityUtilizationMetrics data={amenityUtilization} />

      {/* Assets */}
      {center.equipmentAssets.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-oc-fg-muted uppercase tracking-wider mb-3">
            Equipment ({center.equipmentAssets.length} units)
          </h2>
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([category, assets]) => {
              const catItem = assets[0]
              const heroImage = catItem.catalogItemSku ? catalogMap.get(catItem.catalogItemSku)?.imageUrl : null

              return (
                <div key={category} className="rounded-2xl border border-oc-border overflow-hidden">
                  {/* Cinematic hero */}
                  <div className="relative h-28 bg-oc-deep overflow-hidden">
                    {heroImage && <img src={heroImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center opacity-20" />}
                    <div className="hero-overlay-h" />
                    <div className="hero-overlay-v" />
                    <div className="absolute inset-0 flex items-end px-4 pb-3 gap-2">
                      <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0 mb-0.5" />
                      <p className="text-sm font-bold text-oc-fg">{CATEGORY_DISPLAY_NAMES[category] ?? category}</p>
                      <span className="text-[11px] text-oc-fg-dim">· {assets.length} unit{assets.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-oc-divide bg-oc-base">
                    {assets.map((asset) => {
                      const catalogItem = asset.catalogItemSku ? catalogMap.get(asset.catalogItemSku) : null
                      const hasUpgrade = catalogItem && !catalogItem.isLatestVersion && catalogItem.supersedesSku
                      const newerItem = hasUpgrade ? newerItemMap.get(catalogItem.supersedesSku!) : null
                      const openSRCount = asset.serviceRequests.length

                      return (
                        <div key={asset.id} className="relative px-4 py-3 space-y-2 overflow-hidden">
                          <div className="flex items-start gap-3">
                            {/* Edge-bleed instead of framed thumbnail */}
                            {catalogItem?.imageUrl && (
                              <div
                                className="absolute left-0 top-0 w-28 h-full opacity-20 pointer-events-none"
                                style={{
                                  backgroundImage: `url(${catalogItem.imageUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  maskImage: "linear-gradient(to right, transparent, black 50%, transparent)",
                                  WebkitMaskImage: "linear-gradient(to right, transparent, black 50%, transparent)",
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-oc-fg truncate">{asset.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[11px] font-mono text-oc-fg-dim">{asset.catalogItemSku ?? "—"}</span>
                                {asset.condition === "POOR" && (
                                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Poor condition</span>
                                )}
                              </div>
                              {asset.installationDate && (
                                <p className="text-[11px] text-oc-placeholder mt-0.5">
                                  Installed {new Date(asset.installationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <MaintenanceTimer nextServiceDue={asset.nextServiceDue} />
                              {openSRCount > 0 && (
                                <span className="flex items-center gap-1 text-[11px] text-amber-400 justify-end">
                                  <Ticket className="w-3 h-3" />{openSRCount} ticket{openSRCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          {hasUpgrade && newerItem && (
                            <UpgradeAdCard currentSku={asset.catalogItemSku!} currentName={asset.name} newItem={newerItem} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Trainers */}
      {center.trainerMappings.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-oc-fg-muted uppercase tracking-wider mb-3">
            Trainers ({center.trainerMappings.length})
          </h2>
          <div className="rounded-xl border border-oc-border overflow-hidden divide-y divide-oc-border">
            {center.trainerMappings.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-oc-border border border-oc-muted flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-oc-fg-dim" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-oc-fg-soft">{m.trainer.name}</p>
                  <p className="text-[11px] text-oc-fg-dim">{m.trainer.trainerType} · {m.trainer.specialization ?? "General"}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.trainer.trainerType === "FULLTIME" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                  {m.trainer.trainerType}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quote history */}
      {center.lead?.quote?.historyJson && (
        <section>
          <h2 className="text-sm font-semibold text-oc-fg-muted uppercase tracking-wider mb-3">Quote Journey</h2>
          <div className="rounded-xl border border-oc-border bg-oc-void p-5">
            <QuoteHistoryTimeline historyJson={center.lead.quote.historyJson} />
          </div>
        </section>
      )}
    </div>
  )
}
