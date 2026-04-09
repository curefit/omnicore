import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LeadReviewPanel } from "@/components/leads/LeadReviewPanel"
import { EquipmentRecommendationPanel } from "@/components/leads/EquipmentRecommendationPanel"
import Link from "next/link"

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

  if (lead.formData) {
    try {
      const fd = JSON.parse(lead.formData)
      if (fd.gymSqFt && fd.totalUnits) {
        equipmentCategory = deriveEquipmentCategory(fd.gymSqFt, fd.totalUnits)
        equipmentRecommendation = await prisma.equipmentRecommendation.findUnique({
          where: { sizeCategory: equipmentCategory },
        })
      }
    } catch {
      // ignore malformed formData
    }
  }

  const formData = lead.formData ? (() => {
    try { return JSON.parse(lead.formData!) } catch { return null }
  })() : null

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadReviewPanel lead={lead} formData={formData} />
        {equipmentRecommendation && (
          <EquipmentRecommendationPanel
            category={equipmentCategory!}
            recommendation={equipmentRecommendation}
          />
        )}
      </div>

      {lead.status === "FORM_SUBMITTED" && (
        <div className="flex gap-3">
          <Link
            href={`/cf-admin/leads/${lead.id}/quote`}
            className="px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] transition-colors"
          >
            Build Quote →
          </Link>
        </div>
      )}
    </div>
  )
}
