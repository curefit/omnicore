import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { appendHistory } from "@/lib/leads/quoteHistory"

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({ where: { id }, include: { quote: true } })

  if (!lead?.quote) return NextResponse.json({ error: "No quote found" }, { status: 404 })
  if (["ACCEPTED", "CANCELLED"].includes(lead.quote.status)) {
    return NextResponse.json({ error: "Quote already finalised" }, { status: 409 })
  }

  const newHistory = appendHistory(lead.quote.historyJson, {
    round: lead.quote.revisionRound,
    action: "RWA_CANCELLED",
    actorRole: "RWA_ADMIN",
  })

  await prisma.$transaction([
    prisma.quote.update({ where: { id: lead.quote.id }, data: { status: "CANCELLED", historyJson: newHistory } }),
    prisma.lead.update({ where: { id }, data: { status: "REJECTED" } }),
  ])

  return NextResponse.json({ ok: true })
}
