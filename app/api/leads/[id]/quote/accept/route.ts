import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { Prisma } from "@prisma/client"
import { LeadFormSubmitSchema } from "@/lib/validations/lead"
import { generateCenterCode } from "@/lib/centers/code"
import { appendHistory } from "@/lib/leads/quoteHistory"

const CENTER_SERVICE_URL = process.env.CENTER_SERVICE_URL ?? ""
const CENTER_SERVICE_USER_ID = process.env.CENTER_SERVICE_USER_ID ?? "123456"

/**
 * Registers the newly accepted center in center-service (staging/prod).
 * Returns the external numeric center ID, or null if the call fails
 * (non-blocking — local center is still created successfully).
 */
async function registerInCenterService(formData: {
  name: string
  address: string
  city: string
  capacity?: number | null
}): Promise<number | null> {
  if (!CENTER_SERVICE_URL) {
    console.warn("CENTER_SERVICE_URL not set — skipping center-service registration")
    return null
  }

  try {
    const res = await fetch(`${CENTER_SERVICE_URL}/v1/center/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": CENTER_SERVICE_USER_ID,
      },
      body: JSON.stringify({
        name: formData.name,
        fullAddress1: formData.address,
        city: formData.city,
        vertical: "GYMFIT",
        timezone: "Asia/Kolkata",
        ownerId: CENTER_SERVICE_USER_ID,
        status: "PRELAUNCH",
        capacity: formData.capacity ?? undefined,
        // Hidden from Cult consumer app — residents check in via Cult QR from MyGate booking
        isSaleDisabled: true,
        meta: {
          checkInEnabled: true,       // QR-based resident check-in via gymfit API
          membershipSellable: false,  // No direct Cult membership sales
        },
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`center-service responded ${res.status}: ${text}`)
      return null
    }

    const json = await res.json()
    const externalId = json?.id ?? json?.centerId ?? null
    if (typeof externalId !== "number") {
      console.error("center-service returned unexpected shape:", json)
      return null
    }

    return externalId
  } catch (err) {
    console.error("center-service call failed:", err)
    return null
  }
}

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

  try {
    // Auto-generate a unique center code — retry up to 3 times on collision
    let code = generateCenterCode(formData.name)
    for (let attempt = 0; attempt < 3; attempt++) {
      const conflict = await prisma.center.findUnique({ where: { code } })
      if (!conflict) break
      code = generateCenterCode(formData.name)
      if (attempt === 2) {
        return NextResponse.json(
          { error: "Could not generate a unique center code. Please try again." },
          { status: 409 }
        )
      }
    }

    const center = await prisma.$transaction(async (tx) => {
      const center = await tx.center.create({
        data: {
          name: formData.name,
          code,
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

      // Create EquipmentAsset rows from accepted equipment selection
      const equipmentList = formData.selectedEquipment ?? []

      if (equipmentList.length > 0) {
        const sixMonthsFromNow = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        await tx.equipmentAsset.createMany({
          data: equipmentList.flatMap(({ sku, name, category, qty }) =>
            Array.from({ length: Math.min(qty, 10) }, () => ({
              centerId: center.id,
              name,
              category,
              catalogItemSku: sku,
              condition: "GOOD",
              installationDate: new Date(),
              nextServiceDue: sixMonthsFromNow,
            }))
          ),
        })
      }

      await tx.lead.update({
        where: { id },
        data: { status: "ACCEPTED", centerId: center.id },
      })

      const totalOneTime = lead.quote!.lineItems.reduce((s: number, li: { oneTimeFee: number | null }) => s + (li.oneTimeFee ?? 0), 0)
      const totalMonthly = lead.quote!.lineItems.reduce((s: number, li: { monthlyFee: number | null }) => s + (li.monthlyFee ?? 0), 0)
      const acceptHistory = appendHistory((lead.quote as { historyJson?: string }).historyJson, {
        round: (lead.quote as { revisionRound?: number }).revisionRound ?? 0,
        action: "RWA_ACCEPTED",
        actorRole: "RWA_ADMIN",
        snapshot: {
          totalOneTime,
          totalMonthly,
          totalAmount: (lead.quote as { totalAmount?: number | null }).totalAmount ?? undefined,
          quoteMode: (lead.quote as { quoteMode?: string }).quoteMode,
        },
      })

      await tx.quote.update({
        where: { id: lead.quote!.id },
        data: { status: "ACCEPTED", acceptedAt: new Date(), historyJson: acceptHistory },
      })

      return center
    })

    // Register in center-service after local transaction succeeds.
    // Non-blocking — failure is logged but does not roll back the local center.
    const externalCenterId = await registerInCenterService({
      name: formData.name,
      address: formData.address,
      city: formData.city,
      capacity: formData.capacity,
    })

    if (externalCenterId) {
      await prisma.center.update({
        where: { id: center.id },
        data: { externalCenterId },
      })
    }

    return NextResponse.json({
      centerId: center.id,
      code: center.code,
      externalCenterId: externalCenterId ?? null,
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    console.error("Quote accept error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
