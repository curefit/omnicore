import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { isTokenExpired } from "@/lib/leads/token"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const { searchParams } = new URL(req.url)
  const forQuote = searchParams.get("forQuote") === "true"

  const lead = await prisma.lead.findUnique({ where: { inviteToken: token } })

  if (!lead) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
  }
  // Allow quote review page to load lead+quote even after form is submitted
  if (lead.status === "QUOTE_SENT" && forQuote) {
    const fullLead = await prisma.lead.findUnique({
      where: { inviteToken: token },
      include: { quote: { include: { lineItems: true } } },
    })
    return NextResponse.json({ lead: fullLead })
  }

  if (isTokenExpired(lead.inviteExpiresAt)) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 410 })
  }

  if (lead.status !== "INVITED") {
    return NextResponse.json(
      { error: "This setup link has already been used" },
      { status: 409 }
    )
  }

  return NextResponse.json({
    lead: {
      id: lead.id,
      societyName: lead.societyName,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
    },
  })
}
