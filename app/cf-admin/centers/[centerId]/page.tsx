import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
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
  if (days === null) return <span className="text-[11px] text-[#6b7280]">No schedule</span>
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

  const [bookings, trainersIn, openSRs] = await Promise.all([
    prisma.amenityBooking.count({ where: { centerId, status: "BOOKED", slotDate: { gte: startOfDay, lt: endOfDay } } }),
    prisma.trainerAttendance.count({ where: { centerId, date: { gte: startOfDay }, status: "PRESENT", checkIn: { not: null }, checkOut: null } }),
    prisma.serviceRequest.count({ where: { centerId, status: { in: ["OPEN", "ASSIGNED"] } } }),
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
        <Link href="/cf-admin" className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#e5e7eb] transition-colors">
          <ChevronLeft className="w-4 h-4" />Back to Overview
        </Link>
        <span className="text-[#374151]">/</span>
        <span className="text-sm text-[#e5e7eb]">{center.name}</span>
        {center.lead && (
          <Link href={`/cf-admin/leads/${center.lead.id}`}
            className="ml-auto flex items-center gap-1.5 text-xs text-[#f97316] hover:text-[#ea6c0c] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />Lead & Quote
          </Link>
        )}
      </div>

      {/* Center hero */}
      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] overflow-hidden">
        <div className="px-6 py-5 flex items-start gap-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#1f2937] border border-[#374151] shrink-0">
            <Building2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{center.name}</h1>
              <StatusBadge status={center.status} showDot />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3 h-3 text-[#6b7280]" />
              <p className="text-xs text-[#6b7280]">{center.address}, {center.city} — {center.pincode}</p>
            </div>
            {center.residentialDetails && (
              <p className="text-xs text-[#6b7280] mt-0.5">
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
              <p className="text-2xl font-bold text-white font-mono-metric">{center.gymSqFt.toLocaleString()}</p>
              <p className="text-[11px] text-[#6b7280]">sq ft</p>
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
        <StatCard label="Bookings Today" value={bookings} icon={Activity} accent="cyan" />
        <StatCard label="Trainers Active" value={trainersIn} icon={Users} accent="emerald" />
        <StatCard label="Asset Alerts" value={overdueAssets} icon={Wrench} accent={overdueAssets > 0 ? "amber" : "emerald"} />
        <StatCard label="Open Tickets" value={openSRs} icon={Ticket} accent={openSRs > 0 ? "red" : "emerald"} />
      </div>

      {/* Assets */}
      {center.equipmentAssets.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
            Equipment ({center.equipmentAssets.length} units)
          </h2>
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([category, assets]) => {
              const catItem = assets[0]
              const heroImage = catItem.catalogItemSku ? catalogMap.get(catItem.catalogItemSku)?.imageUrl : null

              return (
                <div key={category} className="rounded-2xl border border-[#1f2937] overflow-hidden">
                  <div className="relative h-16 bg-[#0d1117] overflow-hidden">
                    {heroImage && <img src={heroImage} alt={category} className="w-full h-full object-cover opacity-50" />}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/95 via-[#0a0d14]/70 to-transparent flex items-center px-4 gap-2">
                      <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <p className="text-sm font-bold text-white">{CATEGORY_DISPLAY_NAMES[category] ?? category}</p>
                      <span className="text-[11px] text-[#6b7280]">· {assets.length} unit{assets.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-[#1a2030] bg-[#0a0d14]">
                    {assets.map((asset) => {
                      const catalogItem = asset.catalogItemSku ? catalogMap.get(asset.catalogItemSku) : null
                      const hasUpgrade = catalogItem && !catalogItem.isLatestVersion && catalogItem.supersedesSku
                      const newerItem = hasUpgrade ? newerItemMap.get(catalogItem.supersedesSku!) : null
                      const openSRCount = asset.serviceRequests.length

                      return (
                        <div key={asset.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-start gap-3">
                            {catalogItem?.imageUrl && (
                              <img src={catalogItem.imageUrl} alt={asset.name}
                                className="w-12 h-9 rounded-lg object-cover border border-[#1f2937] shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{asset.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[11px] font-mono text-[#6b7280]">{asset.catalogItemSku ?? "—"}</span>
                                {asset.condition === "POOR" && (
                                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Poor condition</span>
                                )}
                              </div>
                              {asset.installationDate && (
                                <p className="text-[11px] text-[#4b5563] mt-0.5">
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
          <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
            Trainers ({center.trainerMappings.length})
          </h2>
          <div className="rounded-xl border border-[#1f2937] overflow-hidden divide-y divide-[#1f2937]">
            {center.trainerMappings.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#1f2937] border border-[#374151] flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-[#6b7280]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e5e7eb]">{m.trainer.name}</p>
                  <p className="text-[11px] text-[#6b7280]">{m.trainer.trainerType} · {m.trainer.specialization ?? "General"}</p>
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
          <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">Quote Journey</h2>
          <div className="rounded-xl border border-[#1f2937] bg-[#111111] p-5">
            <QuoteHistoryTimeline historyJson={center.lead.quote.historyJson} />
          </div>
        </section>
      )}
    </div>
  )
}
