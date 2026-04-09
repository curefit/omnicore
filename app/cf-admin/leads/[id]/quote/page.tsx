import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { QuoteBuilder } from "@/components/leads/QuoteBuilder"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuotePage({ params }: Props) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      quote: { include: { lineItems: true } },
    },
  })
  if (!lead) notFound()

  const pricingConfigs = await prisma.servicePricingConfig.findMany()

  const formData = lead.formData ? (() => {
    try { return JSON.parse(lead.formData) } catch { return null }
  })() : null

  const selectedModules: string[] = formData?.selectedModules ?? []

  // Equipment from the RWA's wizard selection (or revision if negotiating)
  const rawEquipment = lead.quote?.revisionEquipmentJson
    ? (() => { try { return JSON.parse(lead.quote.revisionEquipmentJson) } catch { return null } })()
    : formData?.selectedEquipment

  const selectedEquipment: Array<{ sku: string; name: string; category: string; qty: number; imageUrl?: string }> =
    Array.isArray(rawEquipment) ? rawEquipment : []

  // Fetch catalog prices for breakdown panel
  const skus = selectedEquipment.map((e) => e.sku)
  const catalogItems = skus.length > 0
    ? await prisma.equipmentCatalogItem.findMany({
        where: { sku: { in: skus } },
        select: { sku: true, minPricePerUnit: true },
      })
    : []

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/cf-admin/leads/${id}`} className="text-oc-fg-dim hover:text-oc-fg-soft text-sm">
          ← Back to Lead
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">Quote Builder</h1>
        <p className="text-sm text-oc-fg-dim mt-1">{lead.societyName}</p>
        {lead.quote?.revisionRound != null && lead.quote.revisionRound > 0 && (
          <p className="text-xs text-amber-400 mt-1">
            Revision round {lead.quote.revisionRound} — RWA Admin updated equipment selection
          </p>
        )}
      </div>
      <QuoteBuilder
        leadId={id}
        selectedModules={selectedModules}
        pricingConfigs={pricingConfigs}
        selectedEquipment={selectedEquipment}
        catalogItems={catalogItems}
        existingQuote={lead.quote}
      />
    </div>
  )
}
