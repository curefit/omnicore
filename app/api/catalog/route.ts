import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"

const CreateCatalogItemSchema = z.object({
  sku: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/i, "SKU: letters, numbers and hyphens only"),
  name: z.string().min(2).max(200),
  category: z.string().min(1),
  series: z.string().optional(),
  specsJson: z.string().max(500).optional(),
  minPricePerUnit: z.number().int().min(0).optional(),
  isHighlight: z.boolean().default(false),
  // If set: old SKU is marked as superseded → this is the "New Version" upgrade flow
  supersedesOldSku: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateCatalogItemSchema.parse(body)

    const existing = await prisma.equipmentCatalogItem.findUnique({ where: { sku: data.sku } })
    if (existing) {
      return NextResponse.json({ error: `SKU "${data.sku}" already exists in catalog` }, { status: 409 })
    }

    // Inherit imageUrl from another item in the same category (consistent imagery)
    const categoryPeer = await prisma.equipmentCatalogItem.findFirst({
      where: { category: data.category },
      select: { imageUrl: true, imageUrl2: true },
    })

    // Determine version number
    const oldItem = data.supersedesOldSku
      ? await prisma.equipmentCatalogItem.findUnique({ where: { sku: data.supersedesOldSku } })
      : null

    const newVersion = oldItem ? (oldItem.version ?? 1) + 1 : 1

    const item = await prisma.$transaction(async (tx) => {
      // Create the new item
      const created = await tx.equipmentCatalogItem.create({
        data: {
          sku: data.sku.toUpperCase(),
          name: data.name,
          category: data.category,
          series: data.series ?? null,
          specsJson: data.specsJson ?? null,
          minPricePerUnit: data.minPricePerUnit ?? null,
          isHighlight: data.isHighlight,
          isLatestVersion: true,
          version: newVersion,
          imageUrl: categoryPeer?.imageUrl ?? null,
          imageUrl2: categoryPeer?.imageUrl2 ?? null,
        },
      })

      // Mark old item as superseded
      if (data.supersedesOldSku && oldItem) {
        await tx.equipmentCatalogItem.update({
          where: { sku: data.supersedesOldSku },
          data: {
            isLatestVersion: false,
            supersedesSku: created.sku,
          },
        })
      }

      return created
    })

    return NextResponse.json({
      item,
      superseded: data.supersedesOldSku ?? null,
    }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 })
    }
    console.error("[catalog POST]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  const items = await prisma.equipmentCatalogItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })
  return NextResponse.json({ items })
}
