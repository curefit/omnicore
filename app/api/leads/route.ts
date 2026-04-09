import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { CreateLeadSchema } from "@/lib/validations/lead"
import { generateInviteToken, tokenExpiresAt } from "@/lib/leads/token"

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { quote: { select: { status: true } } },
  })
  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateLeadSchema.parse(body)
    const lead = await prisma.lead.create({
      data: {
        societyName: data.societyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        status: "INVITED",
        inviteToken: generateInviteToken(),
        inviteExpiresAt: tokenExpiresAt(),
      },
    })
    return NextResponse.json(
      { leadId: lead.id, inviteToken: lead.inviteToken },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    console.error("Create lead error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
