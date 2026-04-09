import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        quote: { include: { lineItems: true } },
      },
    })
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    let equipmentCategory: string | null = null
    if (lead.formData) {
      try {
        const fd = JSON.parse(lead.formData)
        if (fd.gymSqFt && fd.totalUnits) {
          equipmentCategory = deriveEquipmentCategory(fd.gymSqFt, fd.totalUnits)
        }
      } catch {
        // formData may be malformed; ignore
      }
    }

    let equipmentRecommendation = null
    if (equipmentCategory) {
      equipmentRecommendation = await prisma.equipmentRecommendation.findUnique({
        where: { sizeCategory: equipmentCategory },
      })
    }

    return NextResponse.json({ lead, equipmentCategory, equipmentRecommendation })
  } catch (err) {
    console.error("Get lead error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
