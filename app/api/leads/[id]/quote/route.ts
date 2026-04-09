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
