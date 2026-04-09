import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { appendHistory } from "@/lib/leads/quoteHistory"

const RevisionSchema = z.object({
  updatedEquipment: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    category: z.string(),
    qty: z.number().int().min(1),
    imageUrl: z.string().optional(),
  })).min(1, "Select at least one equipment item"),
  notes: z.string().max(1000).optional(),
})

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

    if (!lead?.quote) return NextResponse.json({ error: "No quote found" }, { status: 404 })
    if (!["SENT"].includes(lead.quote.status)) {
      return NextResponse.json({ error: "Quote must be in SENT status to request revision" }, { status: 409 })
    }

    const body = await req.json()
    const data = RevisionSchema.parse(body)

    const newRound = lead.quote.revisionRound + 1
    const newHistory = appendHistory(lead.quote.historyJson, {
      round: newRound,
      action: "RWA_REVISION_REQUESTED",
      actorRole: "RWA_ADMIN",
      notes: data.notes,
      snapshot: { equipmentCount: data.updatedEquipment.length },
    })

    await prisma.quote.update({
      where: { id: lead.quote.id },
      data: {
        status: "REVISION_REQUESTED",
        revisionNotes: data.notes ?? null,
        revisionEquipmentJson: JSON.stringify(data.updatedEquipment),
        revisionRound: { increment: 1 },
        historyJson: newHistory,
      },
    })

    return NextResponse.json({ ok: true, revisionRound: lead.quote.revisionRound + 1 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 })
    }
    console.error("[request-revision]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
