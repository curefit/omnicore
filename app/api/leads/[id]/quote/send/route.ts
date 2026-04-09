import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { appendHistory } from "@/lib/leads/quoteHistory"

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: { include: { lineItems: true } } },
  })

  if (!lead?.quote) {
    return NextResponse.json({ error: "No quote found" }, { status: 404 })
  }
  // Allow send from DRAFT (first send) or REVISION_REQUESTED (re-send after revision)
  if (!["DRAFT", "REVISION_REQUESTED"].includes(lead.quote.status)) {
    return NextResponse.json({ error: "Quote cannot be sent in current status" }, { status: 409 })
  }

  const isRevision = lead.quote.status === "REVISION_REQUESTED"
  const action = isRevision ? "CF_QUOTE_REVISED" as const : "CF_QUOTE_SENT" as const

  const totalOneTime = lead.quote.lineItems.reduce((s, li) => s + (li.oneTimeFee ?? 0), 0)
  const totalMonthly = lead.quote.lineItems.reduce((s, li) => s + (li.monthlyFee ?? 0), 0)

  try {
    const newHistory = appendHistory(lead.quote.historyJson, {
      round: lead.quote.revisionRound,
      action,
      actorRole: "CF_ADMIN",
      snapshot: {
        totalOneTime,
        totalMonthly,
        totalAmount: lead.quote.totalAmount ?? undefined,
        quoteMode: lead.quote.quoteMode,
      },
    })

    await prisma.$transaction([
      prisma.quote.update({
        where: { id: lead.quote.id },
        data: { status: "SENT", sentAt: new Date(), historyJson: newHistory },
      }),
      prisma.lead.update({
        where: { id },
        data: { status: "QUOTE_SENT" },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Quote send error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
