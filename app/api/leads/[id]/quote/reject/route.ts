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
  if (lead.quote.status !== "SENT") {
    return NextResponse.json({ error: "Quote is not in SENT status" }, { status: 409 })
  }

  try {
    await prisma.$transaction([
      prisma.quote.update({
        where: { id: lead.quote.id },
        data: { status: "REJECTED" },
      }),
      prisma.lead.update({
        where: { id },
        data: { status: "REJECTED" },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Quote reject error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
