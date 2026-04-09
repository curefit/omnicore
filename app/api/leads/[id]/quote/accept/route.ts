import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { LeadFormSubmitSchema } from "@/lib/validations/lead"

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
  if (lead.quote.status !== "SENT") {
    return NextResponse.json({ error: "Quote is not in SENT status" }, { status: 409 })
  }
  if (!lead.formData) {
    return NextResponse.json({ error: "No form data on lead" }, { status: 400 })
  }

  let formData: ReturnType<typeof LeadFormSubmitSchema.parse>
  try {
    formData = LeadFormSubmitSchema.parse(JSON.parse(lead.formData))
  } catch {
    return NextResponse.json({ error: "Stored form data is invalid" }, { status: 400 })
  }

  // Check for duplicate center code
  const existing = await prisma.center.findUnique({ where: { code: formData.code } })
  if (existing) {
    return NextResponse.json(
      { error: `Center code ${formData.code} already exists` },
      { status: 409 }
    )
  }

  const center = await prisma.$transaction(async (tx) => {
    const center = await tx.center.create({
      data: {
        name: formData.name,
        code: formData.code,
        status: "ONBOARDING",
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        capacity: formData.capacity,
        gymSqFt: formData.gymSqFt ?? null,
      },
    })

    await tx.residentialDetails.create({
      data: {
        centerId: center.id,
        rwaName: formData.rwaName,
        totalUnits: formData.totalUnits,
        contactPersonName: formData.contactPersonName,
        contactPersonPhone: formData.contactPersonPhone,
        contactPersonEmail: formData.contactPersonEmail,
      },
    })

    if (formData.selectedModules.length > 0) {
      await tx.centerModule.createMany({
        data: formData.selectedModules.map((moduleKey) => ({
          centerId: center.id,
          moduleKey,
          isEnabled: true,
          config:
            moduleKey === "BRANDING" && formData.displayName
              ? JSON.stringify({ displayName: formData.displayName })
              : null,
        })),
      })
    }

    if (
      formData.selectedModules.includes("MYGATE") &&
      formData.myGateSocietyId &&
      formData.myGateApiKey
    ) {
      await tx.myGateConfig.create({
        data: {
          centerId: center.id,
          societyId: formData.myGateSocietyId,
          apiKey: formData.myGateApiKey,
          webhookUrl: formData.myGateWebhookUrl ?? null,
          isActive: false,
        },
      })
    }

    if (formData.trainerIds?.length) {
      await tx.centerTrainerMapping.createMany({
        data: formData.trainerIds.map((trainerId) => ({
          centerId: center.id,
          trainerId,
          isActive: true,
        })),
      })
    }

    await tx.lead.update({
      where: { id },
      data: { status: "ACCEPTED", centerId: center.id },
    })

    await tx.quote.update({
      where: { id: lead.quote!.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    })

    return center
  })

  return NextResponse.json({ centerId: center.id, code: center.code })
}
