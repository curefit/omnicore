"use client"

import { useState } from "react"
import { Building2, ChevronDown, ChevronRight, TrendingUp } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatPaise } from "@/lib/leads/quote"
import { parseHistory, ACTION_LABEL, ACTION_DOT } from "@/lib/leads/quoteHistory"
import Link from "next/link"
import type { CenterUtilization } from "@/lib/amenity/utilization"
import { AmenityUtilizationMetrics } from "@/components/amenity/AmenityUtilizationMetrics"

interface LineItem {
  moduleKey: string
  pricingType: string
  oneTimeFee: number | null
  monthlyFee: number | null
}

interface ServiceConfig {
  monthlyFee: number
  serviceName: string
}

interface Center {
  id: string
  name: string
  code: string
  status: string
  city: string
  gymSqFt: number | null
  modules: { moduleKey: string; isEnabled: boolean }[]
  residentialDetails: { totalUnits: number } | null
  serviceConfigs?: ServiceConfig[]
  lead: {
    id: string
    status: string
    quote: {
      status: string
      quoteMode: string
      totalAmount: number | null
      revisionRound: number
      historyJson: string | null
      lineItems: LineItem[]
    } | null
  } | null
}

function quoteStatusDot(quoteStatus: string | undefined): string {
  if (!quoteStatus) return "bg-oc-fg-dim"
  const map: Record<string, string> = {
    DRAFT: "bg-oc-muted",
    SENT: "bg-[#f97316]",
    REVISION_REQUESTED: "bg-amber-400 animate-pulse",
    ACCEPTED: "bg-emerald-400",
    REJECTED: "bg-red-400",
    CANCELLED: "bg-red-400",
  }
  return map[quoteStatus] ?? "bg-oc-fg-dim"
}

function quoteStatusLabel(quoteStatus: string | undefined, revisionRound: number): string {
  if (!quoteStatus) return "No quote"
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    SENT: "Quote sent",
    REVISION_REQUESTED: `Revision requested (R${revisionRound})`,
    ACCEPTED: "Accepted ✓",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  }
  return labels[quoteStatus] ?? quoteStatus
}

export function CenterQuoteStatusCard({
  center,
  amenityUtil,
}: {
  center: Center
  amenityUtil?: CenterUtilization
}) {
  const [expanded, setExpanded] = useState(false)
  const quote = center.lead?.quote
  const history = parseHistory(quote?.historyJson)
  const hasBilling = quote?.status === "ACCEPTED"

  // Legacy active center: ACTIVE but no accepted lead/quote in funnel
  const isLegacyActive = center.status === "ACTIVE" && !hasBilling
  const legacyMonthly = isLegacyActive && center.serviceConfigs
    ? center.serviceConfigs.reduce((s, sc) => s + sc.monthlyFee * 100, 0) // ₹ → paise
    : 0

  const totalOneTime = hasBilling && quote?.quoteMode === "ITEMIZED"
    ? quote.lineItems.reduce((s, li) => s + (li.oneTimeFee ?? 0), 0)
    : null
  const totalMonthly = hasBilling && quote?.quoteMode === "ITEMIZED"
    ? quote.lineItems.reduce((s, li) => s + (li.monthlyFee ?? 0), 0)
    : null

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${hasBilling ? "border-emerald-500/20" : "border-oc-border"}`}>
      {/* Main row */}
      <div className="flex items-center gap-4 px-4 py-3 bg-oc-card hover:bg-oc-hover transition-colors">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-oc-border border border-oc-muted shrink-0">
          <Building2 className="w-4 h-4 text-oc-fg-dim" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-oc-fg truncate">{center.name}</p>
            <StatusBadge status={center.status} showDot />
          </div>
          <p className="text-[11px] text-oc-fg-dim mt-0.5">
            {center.city} · {center.code}
            {center.gymSqFt && ` · ${center.gymSqFt.toLocaleString()} sqft`}
            {center.residentialDetails && ` · ${center.residentialDetails.totalUnits.toLocaleString()} units`}
          </p>
          {amenityUtil && (
            <div className="mt-1.5">
              <AmenityUtilizationMetrics data={amenityUtil} compact />
            </div>
          )}
        </div>

        {/* Quote status dot + label / legacy active badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isLegacyActive ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active · Pre-funnel
            </span>
          ) : center.lead ? (
            <>
              <div className={`w-2.5 h-2.5 rounded-full ${quoteStatusDot(quote?.status)}`} />
              <span className="text-[11px] text-oc-fg-muted hidden sm:block">
                {quoteStatusLabel(quote?.status, quote?.revisionRound ?? 0)}
              </span>
            </>
          ) : null}
        </div>

        {/* Billing summary inline */}
        {hasBilling && (
          <div className="shrink-0 text-right hidden md:block">
            {quote?.quoteMode === "TOTAL" && quote.totalAmount ? (
              <p className="text-sm font-bold text-emerald-400">{formatPaise(quote.totalAmount)}</p>
            ) : (
              <>
                {totalOneTime != null && totalOneTime > 0 && (
                  <p className="text-xs text-oc-fg-muted">{formatPaise(totalOneTime)} setup</p>
                )}
                {totalMonthly != null && totalMonthly > 0 && (
                  <p className="text-xs text-emerald-400">{formatPaise(totalMonthly)}/mo</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Legacy recurring revenue */}
        {isLegacyActive && legacyMonthly > 0 && (
          <div className="shrink-0 text-right hidden md:block">
            <p className="text-xs text-emerald-400">{formatPaise(legacyMonthly)}/mo</p>
            <p className="text-[10px] text-oc-fg-dim">est. recurring</p>
          </div>
        )}

        {/* Expand / navigate */}
        <div className="flex items-center gap-1 shrink-0">
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-oc-border text-oc-fg-dim hover:text-oc-fg transition-colors"
              title="Show quote history"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 -rotate-90" />}
            </button>
          )}
          {/* Center detail (RWA replica for CF Admin) vs lead page */}
          <Link
            href={`/cf-admin/centers/${center.id}`}
            className="p-1.5 rounded-lg hover:bg-oc-border text-oc-fg-dim hover:text-oc-fg transition-colors"
            title="View center detail"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Expandable history dropdown */}
      {expanded && history.length > 0 && (
        <div className="px-4 py-3 bg-oc-deep border-t border-oc-border">
          <p className="text-[10px] font-semibold text-oc-fg-dim uppercase tracking-wider mb-2.5">Quote Journey</p>
          <div className="space-y-2">
            {history.map((entry, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${ACTION_DOT[entry.action]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-oc-fg-soft font-medium">{ACTION_LABEL[entry.action]}</p>
                  {entry.notes && <p className="text-[10px] text-oc-fg-dim italic">&ldquo;{entry.notes}&rdquo;</p>}
                  {entry.snapshot?.totalOneTime != null && entry.snapshot.totalOneTime > 0 && (
                    <p className="text-[10px] text-oc-placeholder">
                      {formatPaise(entry.snapshot.totalOneTime)} one-time
                      {entry.snapshot.totalMonthly ? ` · ${formatPaise(entry.snapshot.totalMonthly)}/mo` : ""}
                    </p>
                  )}
                  {entry.snapshot?.totalAmount != null && (
                    <p className="text-[10px] text-oc-placeholder">
                      Total: {formatPaise(entry.snapshot.totalAmount)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-oc-muted shrink-0">
                  {new Date(entry.ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
