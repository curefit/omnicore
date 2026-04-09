import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"

const PatchCatalogSchema = z.object({
  specsJson: z.string().nullable().optional(),
  minPricePerUnit: z.number().int().min(0).nullable().optional(),
  isLatestVersion: z.boolean().optional(),
  supersedesSku: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await context.params
    const decodedSku = decodeURIComponent(sku)
    const body = await req.json()
    const data = PatchCatalogSchema.parse(body)

    const item = await prisma.equipmentCatalogItem.findUnique({ where: { sku: decodedSku } })
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    const updated = await prisma.equipmentCatalogItem.update({
      where: { sku: decodedSku },
      data: {
        ...(data.specsJson !== undefined && { specsJson: data.specsJson }),
        ...(data.minPricePerUnit !== undefined && { minPricePerUnit: data.minPricePerUnit }),
        ...(data.isLatestVersion !== undefined && { isLatestVersion: data.isLatestVersion }),
        ...(data.supersedesSku !== undefined && { supersedesSku: data.supersedesSku }),
      },
    })

    return NextResponse.json({ item: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 })
    }
    console.error("[catalog PATCH]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params
  const item = await prisma.equipmentCatalogItem.findUnique({ where: { sku: decodeURIComponent(sku) } })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item })
}
