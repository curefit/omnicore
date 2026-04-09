import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LeadReviewPanel } from "@/components/leads/LeadReviewPanel"
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

  if (formData?.gymSqFt && formData?.totalUnits) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cf-admin/leads" className="text-[#6b7280] hover:text-[#e5e7eb] text-sm">
          ← Back to Leads
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#e5e7eb]">{lead.societyName}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{lead.contactEmail}</p>
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
            <p className="text-sm text-[#9ca3af] pl-6">&ldquo;{lead.quote.revisionNotes}&rdquo;</p>
          )}
          {revisionEquipment && Array.isArray(revisionEquipment) && (
            <div className="pl-6">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                Updated equipment selection ({revisionEquipment.length} items):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {revisionEquipment.map((item: { sku: string; name: string; qty: number }) => (
                  <span
                    key={item.sku}
                    className="text-xs bg-[#1f2937] text-[#e5e7eb] border border-[#374151] px-2 py-0.5 rounded"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Revise Quote →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            className="px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] transition-colors"
          >
            Build Quote →
          </Link>
        </div>
      )}

      {lead.quote && lead.quote.status === "SENT" && !isRevisionRequested && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-400">Quote sent — awaiting RWA Admin response.</p>
        </div>
      )}

      {lead.quote && lead.quote.status === "DRAFT" && (
        <Link
          href={`/cf-admin/leads/${lead.id}/quote`}
          className="inline-block px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] transition-colors"
        >
          Continue Quote →
        </Link>
      )}

      {/* Quote history timeline */}
      {lead.quote?.historyJson && (
        <div className="rounded-xl border border-[#1f2937] bg-[#111111] p-5">
          <QuoteHistoryTimeline historyJson={lead.quote.historyJson} />
        </div>
      )}
    </div>
  )
}
