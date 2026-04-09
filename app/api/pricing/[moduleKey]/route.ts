import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { UpdatePricingConfigSchema } from "@/lib/validations/quote"

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const { moduleKey } = await context.params
    const body = await req.json()
    const data = UpdatePricingConfigSchema.parse(body)

    const config = await prisma.servicePricingConfig.update({
      where: { moduleKey },
      data,
    })

    return NextResponse.json({ config })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Pricing config not found" }, { status: 404 })
    }
    console.error("Pricing update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
