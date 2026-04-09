import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LeadReviewPanel } from "@/components/leads/LeadReviewPanel"
import { RwaQuoteLinkCard } from "@/components/leads/RwaQuoteLinkCard"
import { getPublicRwaQuoteUrl } from "@/lib/leads/rwaLinks"
import { EquipmentRecommendationPanel } from "@/components/leads/EquipmentRecommendationPanel"
import { QuoteHistoryTimeline } from "@/components/leads/QuoteHistoryTimeline"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: { include: { lineItems: true } } },
  })
  if (!lead) notFound()

  let equipmentCategory: string | null = null
  let equipmentRecommendation = null

  const formData = lead.formData ? (() => {
    try { return JSON.parse(lead.formData!) } catch { return null }
  })() : null

  const wantsAssets =
    Array.isArray(formData?.selectedModules) && formData.selectedModules.includes("ASSETS")

  if (wantsAssets && formData?.gymSqFt && formData?.totalUnits) {
    equipmentCategory = deriveEquipmentCategory(formData.gymSqFt, formData.totalUnits)
    equipmentRecommendation = await prisma.equipmentRecommendation.findUnique({
      where: { sizeCategory: equipmentCategory },
    })
  }

  // Parse revision equipment if negotiating
  const revisionEquipment = lead.quote?.revisionEquipmentJson
    ? (() => { try { return JSON.parse(lead.quote.revisionEquipmentJson) } catch { return null } })()
    : null

  const isRevisionRequested = lead.quote?.status === "REVISION_REQUESTED"

  const showRwaQuoteLink =
    lead.status === "QUOTE_SENT" &&
    lead.quote &&
    (lead.quote.status === "SENT" || lead.quote.status === "REVISION_REQUESTED")

  const rwaQuoteUrl = getPublicRwaQuoteUrl(lead.inviteToken)
  const showRwaBaseUrlHint = !rwaQuoteUrl.startsWith("http")

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cf-admin/leads" className="text-oc-fg-dim hover:text-oc-fg-soft text-sm">
          ← Back to Leads
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">{lead.societyName}</h1>
          <p className="text-sm text-oc-fg-dim mt-1">{lead.contactEmail}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {/* Revision request banner */}
      {isRevisionRequested && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-400">
              RWA Admin requested changes — Round {lead.quote?.revisionRound}
            </p>
          </div>
          {lead.quote?.revisionNotes && (
            <p className="text-sm text-oc-fg-muted pl-6">&ldquo;{lead.quote.revisionNotes}&rdquo;</p>
          )}
          {revisionEquipment && Array.isArray(revisionEquipment) && (
            <div className="pl-6">
              <p className="text-xs font-semibold text-oc-fg-dim uppercase tracking-wider mb-2">
                Updated equipment selection ({revisionEquipment.length} items):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {revisionEquipment.map((item: { sku: string; name: string; qty: number }) => (
                  <span
                    key={item.sku}
                    className="text-xs bg-oc-border text-oc-fg-soft border border-oc-muted px-2 py-0.5 rounded"
                  >
                    {item.qty}× {item.name.split(" CS-")[0].trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="pl-6">
            <Link
              href={`/cf-admin/leads/${lead.id}/quote`}
              className="btn-primary"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Revise Quote →
            </Link>
          </div>
        </div>
      )}

      {showRwaQuoteLink && lead.quote && (
        <RwaQuoteLinkCard
          url={rwaQuoteUrl}
          quoteStatus={lead.quote.status === "REVISION_REQUESTED" ? "REVISION_REQUESTED" : "SENT"}
          showBaseUrlHint={showRwaBaseUrlHint}
        />
      )}

      <div
        className={`grid grid-cols-1 gap-6 ${equipmentRecommendation ? "lg:grid-cols-2" : ""}`}
      >
        <LeadReviewPanel lead={lead} formData={formData} />
        {equipmentRecommendation && (
          <EquipmentRecommendationPanel
            category={equipmentCategory!}
            recommendation={equipmentRecommendation}
          />
        )}
      </div>

      {lead.status === "FORM_SUBMITTED" && !lead.quote && (
        <div className="flex gap-3">
          <Link
            href={`/cf-admin/leads/${lead.id}/quote`}
            className="btn-primary"
          >
            Build Quote →
          </Link>
        </div>
      )}

      {lead.quote && lead.quote.status === "DRAFT" && (
        <Link
          href={`/cf-admin/leads/${lead.id}/quote`}
          className="btn-primary"
        >
          Continue Quote →
        </Link>
      )}

      {/* Quote history timeline */}
      {lead.quote?.historyJson && (
        <div className="rounded-xl border border-oc-border bg-oc-void p-5">
          <QuoteHistoryTimeline historyJson={lead.quote.historyJson} />
        </div>
      )}
    </div>
  )
}
