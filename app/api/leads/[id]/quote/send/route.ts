import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: true },
  })

  if (!lead?.quote) {
    return NextResponse.json({ error: "No quote found" }, { status: 404 })
  }
  if (lead.quote.status !== "DRAFT") {
    return NextResponse.json({ error: "Quote is not in DRAFT status" }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: lead.quote.id },
      data: { status: "SENT", sentAt: new Date() },
    }),
    prisma.lead.update({
      where: { id },
      data: { status: "QUOTE_SENT" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
