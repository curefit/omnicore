import { Building2, Users, Wrench, Ticket, TrendingUp, ChevronRight, IndianRupee } from "lucide-react"
import { prisma } from "@/lib/db/client"
import { StatCard } from "@/components/shared/StatCard"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { CenterQuoteStatusCard } from "@/components/leads/CenterQuoteStatusCard"
import Link from "next/link"
import { formatPaise } from "@/lib/leads/quote"

function quoteTotal(q: { quoteMode: string; totalAmount: number | null; lineItems: { oneTimeFee: number | null; monthlyFee: number | null }[] }) {
  if (q.quoteMode === "TOTAL") return { oneTime: q.totalAmount ?? 0, monthly: 0 }
  return {
    oneTime: q.lineItems.reduce((s, li) => s + (li.oneTimeFee ?? 0), 0),
    monthly: q.lineItems.reduce((s, li) => s + (li.monthlyFee ?? 0), 0),
  }
}

async function getStats() {
  const [activeCenters, mappedTrainers, trackedAssets, openRequests] = await Promise.all([
    prisma.center.count({ where: { status: "ACTIVE" } }),
    prisma.centerTrainerMapping.count({ where: { isActive: true } }),
    prisma.equipmentAsset.count(),
    prisma.serviceRequest.count({ where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } } }),
  ])
  return { activeCenters, mappedTrainers, trackedAssets, openRequests }
}

async function getCentersWithLeads() {
  const centers = await prisma.center.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      residentialDetails: true,
      modules: { where: { isEnabled: true } },
      // ServiceConfigs capture revenue for legacy ACTIVE centers not in the quote funnel
      serviceConfigs: { where: { isActive: true } },
      lead: { include: { quote: { include: { lineItems: true } } } },
    },
  })

  const pipelineLeads = await prisma.lead.findMany({
    where: { centerId: null, status: { notIn: ["REJECTED"] } },
    include: { quote: { include: { lineItems: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  })

  return { centers, pipelineLeads }
}

export default async function CFAdminOverviewPage() {
  const [stats, { centers, pipelineLeads }] = await Promise.all([
    getStats(),
    getCentersWithLeads(),
  ])

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // ── Quote-funnel revenue (new centers via lead → quote → accept) ──────────
  const acceptedQuotes = centers
    .map((c) => c.lead?.quote)
    .filter((q): q is NonNullable<typeof q> => q?.status === "ACCEPTED")

  const thisMonthQuotes = acceptedQuotes.filter(
    (q) => q.acceptedAt != null && new Date(q.acceptedAt) >= startOfMonth
  )
  const billedThisMonth = thisMonthQuotes.reduce((s, q) => s + quoteTotal(q).oneTime, 0)

  const quoteFunnelOneTime = acceptedQuotes.reduce((s, q) => s + quoteTotal(q).oneTime, 0)
  const quoteFunnelMonthly = acceptedQuotes.reduce((s, q) => s + quoteTotal(q).monthly, 0)

  // ── Legacy ACTIVE centers (created via old onboarding, no lead/quote) ─────
  // Their ServiceConfig fees represent recurring revenue already being collected.
  const legacyCenters = centers.filter(
    (c) => c.status === "ACTIVE" && (!c.lead || c.lead.quote?.status !== "ACCEPTED")
  )
  // Approximate: monthlyFee on ServiceConfig is per-service per-member-plan, so sum them
  const legacyMonthly = legacyCenters.reduce(
    (s, c) => s + c.serviceConfigs.reduce((ss, sc) => ss + sc.monthlyFee * 100, 0), // convert ₹ → paise
    0
  )
  const legacyCenterCount = legacyCenters.length

  // ── Combined lifetime ──────────────────────────────────────────────────────
  const lifetimeRevenue = quoteFunnelOneTime  // one-time setup from quote funnel
  const lifetimeMonthly = quoteFunnelMonthly + legacyMonthly  // all recurring

  // Pipeline estimated revenue — SENT quotes not yet accepted
  const allPipelineQuotes = [
    ...pipelineLeads.map((l) => l.quote),
    ...centers.map((c) => c.lead?.quote).filter((q) => q?.status === "SENT" || q?.status === "REVISION_REQUESTED"),
  ].filter((q): q is NonNullable<typeof q> => q != null)

  const estimatedRevenue = allPipelineQuotes.reduce((s, q) => s + quoteTotal(q).oneTime, 0)
  const estimatedMonthly = allPipelineQuotes.reduce((s, q) => s + quoteTotal(q).monthly, 0)

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Operations Hub"
        description="Manage centers, trainers, assets, and service workflows across all facilities."
      />

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Centers" value={stats.activeCenters} icon={Building2} accent="cyan" />
        <StatCard label="Mapped Trainers" value={stats.mappedTrainers} icon={Users} accent="purple" />
        <StatCard label="Assets Tracked" value={stats.trackedAssets} icon={Wrench} accent="emerald" />
        <StatCard label="Open Requests" value={stats.openRequests} icon={Ticket} accent="amber"
          description={stats.openRequests > 0 ? "needs attention" : "all clear"} />
      </div>

      {/* Revenue row — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Billed this month */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
            Billed This Month
          </p>
          <p className="text-2xl font-bold text-white font-mono-metric">
            {billedThisMonth > 0 ? formatPaise(billedThisMonth) : "₹0"}
          </p>
          <p className="text-[11px] text-[#6b7280] mt-0.5">
            {thisMonthQuotes.length} accepted {thisMonthQuotes.length === 1 ? "quote" : "quotes"}
          </p>
        </div>

        {/* Lifetime revenue */}
        <div className="rounded-xl border border-[#f97316]/20 bg-[#f97316]/5 px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
            Lifetime Revenue
          </p>
          <p className="text-2xl font-bold text-[#f97316] font-mono-metric">
            {lifetimeRevenue > 0 ? formatPaise(lifetimeRevenue) : "₹0"}
          </p>
          {lifetimeMonthly > 0 && (
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              + {formatPaise(lifetimeMonthly)}/mo recurring
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-1.5">
            {acceptedQuotes.length > 0 && (
              <span className="text-[10px] text-[#f97316]/70">
                {acceptedQuotes.length} quoted center{acceptedQuotes.length !== 1 ? "s" : ""}
              </span>
            )}
            {legacyCenterCount > 0 && (
              <span className="text-[10px] text-emerald-400/70">
                + {legacyCenterCount} active (pre-funnel)
              </span>
            )}
          </div>
        </div>

        {/* Pipeline estimate */}
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
            Pipeline Estimate
          </p>
          <p className="text-2xl font-bold text-cyan-400 font-mono-metric">
            {estimatedRevenue > 0 ? formatPaise(estimatedRevenue) : "₹0"}
          </p>
          {estimatedMonthly > 0 && (
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              + {formatPaise(estimatedMonthly)}/mo if all close · {allPipelineQuotes.length} quotes
            </p>
          )}
          {estimatedMonthly === 0 && (
            <p className="text-[11px] text-[#6b7280] mt-0.5">{allPipelineQuotes.length} quotes in pipeline</p>
          )}
        </div>
      </div>

      {/* Centers */}
      {centers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider">Centers</h2>
            <Link href="/cf-admin/onboarding" className="text-xs text-[#f97316] hover:text-[#ea6c0c] transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {centers.map((center) => (
              <CenterQuoteStatusCard key={center.id} center={center} />
            ))}
          </div>
        </section>
      )}

      {/* Lead pipeline */}
      {pipelineLeads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider">Quote Pipeline</h2>
            <Link href="/cf-admin/leads" className="text-xs text-[#f97316] hover:text-[#ea6c0c] transition-colors">
              Manage leads →
            </Link>
          </div>
          <div className="rounded-xl border border-[#1f2937] overflow-hidden divide-y divide-[#1f2937]">
            {pipelineLeads.map((lead) => {
              const q = lead.quote
              const statusDot = !q ? "bg-[#6b7280]"
                : q.status === "SENT" ? "bg-[#f97316]"
                : q.status === "REVISION_REQUESTED" ? "bg-amber-400"
                : q.status === "ACCEPTED" ? "bg-emerald-400"
                : q.status === "REJECTED" || q.status === "CANCELLED" ? "bg-red-400"
                : "bg-[#374151]"
              const statusLabel = !q ? "Invited"
                : q.status === "SENT" ? "Quote Sent"
                : q.status === "REVISION_REQUESTED" ? "Revision Requested"
                : q.status === "ACCEPTED" ? "Accepted"
                : q.status === "DRAFT" ? "Draft"
                : q.status

              const est = q ? quoteTotal(q) : null

              return (
                <Link key={lead.id} href={`/cf-admin/leads/${lead.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-[#111827] transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e5e7eb] truncate">{lead.societyName}</p>
                    <p className="text-[11px] text-[#6b7280]">{lead.contactEmail}</p>
                  </div>
                  {est && (est.oneTime > 0 || est.monthly > 0) && (
                    <div className="text-right shrink-0">
                      {est.oneTime > 0 && <p className="text-xs text-cyan-400">{formatPaise(est.oneTime)}</p>}
                      {est.monthly > 0 && <p className="text-[10px] text-[#6b7280]">{formatPaise(est.monthly)}/mo</p>}
                    </div>
                  )}
                  <span className="text-xs text-[#6b7280] shrink-0">{statusLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#374151] shrink-0" />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
