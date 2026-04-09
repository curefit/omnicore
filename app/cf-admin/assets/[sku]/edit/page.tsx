import { prisma } from "@/lib/db/client"
import { notFound } from "next/navigation"
import { CatalogItemEditForm } from "./CatalogItemEditForm"
import Link from "next/link"
import { CATEGORY_DISPLAY_NAMES, EQUIPMENT_CATALOG } from "@/lib/equipment/catalog"

interface Props {
  params: Promise<{ sku: string }>
}

export default async function EditCatalogItemPage({ params }: Props) {
  const { sku } = await params
  const decodedSku = decodeURIComponent(sku)

  const item = await prisma.equipmentCatalogItem.findUnique({ where: { sku: decodedSku } })
  if (!item) notFound()

  // Get all items in the same category for the "superseded by" dropdown
  const sameCategoryItems = await prisma.equipmentCatalogItem.findMany({
    where: { category: item.category, sku: { not: item.sku } },
    select: { sku: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/cf-admin/assets" className="text-oc-fg-dim hover:text-oc-fg-soft text-sm">
          ← Back to Catalog
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">{item.name}</h1>
        <p className="text-sm text-oc-fg-dim mt-1 font-mono">{item.sku} · {CATEGORY_DISPLAY_NAMES[item.category] ?? item.category}</p>
      </div>

      {item.imageUrl && (
        <div className="relative h-40 rounded-xl overflow-hidden border border-oc-border">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-oc-base/80 to-transparent" />
        </div>
      )}

      <CatalogItemEditForm item={item} sameCategoryItems={sameCategoryItems} />
    </div>
  )
}
