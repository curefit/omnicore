import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { CreateQuoteSchema } from "@/lib/validations/quote"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { quote: true },
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }
    if (lead.status !== "FORM_SUBMITTED") {
      return NextResponse.json(
        { error: "Cannot create quote: form not submitted yet" },
        { status: 409 }
      )
    }

    const body = await req.json()
    const data = CreateQuoteSchema.parse(body)

    // Enforce catalog minimum price for ASSETS line item
    const assetsLine = data.lineItems.find((li) => li.moduleKey === "ASSETS")
    if (assetsLine && (assetsLine.oneTimeFee ?? 0) > 0 && lead.formData) {
      try {
        const formData = JSON.parse(lead.formData)
        const equipment: Array<{ sku: string; qty: number }> = formData?.selectedEquipment ?? []
        if (equipment.length > 0) {
          const skus = equipment.map((e) => e.sku)
          const catalogItems = await prisma.equipmentCatalogItem.findMany({
            where: { sku: { in: skus } },
            select: { sku: true, minPricePerUnit: true },
          })
          const priceMap = new Map(catalogItems.map((c) => [c.sku, c.minPricePerUnit ?? 0]))
          const catalogMinimum = equipment.reduce(
            (sum, item) => sum + (priceMap.get(item.sku) ?? 0) * item.qty, 0
          )
          if (catalogMinimum > 0 && (assetsLine.oneTimeFee ?? 0) < catalogMinimum) {
            return NextResponse.json(
              {
                error: `ASSETS one-time fee (${assetsLine.oneTimeFee}) is below catalog minimum (${catalogMinimum}). Increase to at least the catalog floor.`,
              },
              { status: 422 }
            )
          }
        }
      } catch { /* formData parse failure — skip enforcement */ }
    }

    const quote = await prisma.$transaction(async (tx) => {
      if (lead.quote) {
        await tx.quoteLineItem.deleteMany({ where: { quoteId: lead.quote.id } })
        await tx.quote.delete({ where: { id: lead.quote.id } })
      }
      return tx.quote.create({
        data: {
          leadId: id,
          status: "DRAFT",
          notes: data.notes ?? null,
          quoteMode: data.quoteMode ?? "ITEMIZED",
          totalAmount: data.quoteMode === "TOTAL" ? (data.totalAmount ?? null) : null,
          lineItems: {
            create: data.lineItems.map((item) => ({
              moduleKey: item.moduleKey,
              pricingType: item.pricingType,
              oneTimeFee: item.oneTimeFee ?? null,
              monthlyFee: item.monthlyFee ?? null,
              takeRatePct: item.takeRatePct ?? null,
            })),
          },
        },
        include: { lineItems: true },
      })
    })

    return NextResponse.json({ quote }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    console.error("Quote create error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
