import { prisma } from "@/lib/db/client"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import { formatPaise } from "@/lib/leads/quote"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { AddEquipmentForm } from "@/components/equipment/AddEquipmentForm"
import Link from "next/link"
import { Pencil, AlertCircle, Package } from "lucide-react"

async function getCatalog() {
  return prisma.equipmentCatalogItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] })
}

export default async function CFAdminAssetsPage() {
  const items = await getCatalog()

  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    if (!grouped.has(item.category)) grouped.set(item.category, [])
    grouped.get(item.category)!.push(item)
  }

  const totalWithPrice = items.filter((i) => i.minPricePerUnit != null).length

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Equipment Catalog"
        description="Manage Cultsport equipment catalog, minimum prices, and version tracking."
        action={
          <div className="flex items-center gap-3 text-sm">
            <span className="font-display font-bold text-oc-fg">{items.length}</span>
            <span className="text-oc-fg-dim">items</span>
            <span className="text-oc-muted">·</span>
            <span className="font-display font-bold text-oc-fg">{totalWithPrice}</span>
            <span className="text-oc-fg-dim">priced</span>
          </div>
        }
      />

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([category, catItems]) => {
          const heroImage = catItems[0]?.imageUrl
          const displayName = CATEGORY_DISPLAY_NAMES[category] ?? category

          return (
            <div key={category} className="rounded-2xl border border-oc-border overflow-hidden oc-shadow-lg bg-oc-card">
              {/* Category hero header */}
              <div className="relative h-28 overflow-hidden bg-gradient-to-r from-oc-deep via-oc-card to-oc-deep">
                {heroImage && (
                  <img
                    src={heroImage}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-15"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-oc-deep via-oc-deep/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-oc-card via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-end px-6 pb-5 gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                    <Package className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-oc-fg tracking-[-0.01em]">{displayName}</h3>
                    <p className="text-xs text-oc-fg-dim mt-0.5">{catItems.length} product{catItems.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {/* Items list */}
              <div className="divide-y divide-oc-divide">
                {catItems.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-oc-hover transition-colors"
                  >
                    {/* Item thumbnail */}
                    {item.imageUrl ? (
                      <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-oc-deep border border-oc-border">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-oc-deep border border-oc-border flex items-center justify-center">
                        <Package className="w-5 h-5 text-oc-muted" />
                      </div>
                    )}

                    {/* Name + SKU + specs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-oc-fg truncate">{item.name}</p>
                        {!item.isLatestVersion && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Superseded
                          </span>
                        )}
                        {item.supersedesSku && (
                          <span className="text-[10px] text-oc-fg-dim">
                            replaced by {item.supersedesSku}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-oc-fg-dim font-mono mt-0.5">{item.sku}</p>
                      {item.specsJson && (
                        <p className="text-xs text-oc-placeholder truncate mt-0.5">{item.specsJson}</p>
                      )}
                    </div>

                    {/* Min price */}
                    <div className="text-right shrink-0 min-w-[110px]">
                      {item.minPricePerUnit ? (
                        <p className="text-sm font-bold font-mono-metric text-oc-fg">
                          {formatPaise(item.minPricePerUnit)}
                        </p>
                      ) : (
                        <p className="text-xs text-oc-placeholder italic">no price set</p>
                      )}
                      <p className="text-[10px] text-oc-fg-dim">min / unit</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.isLatestVersion && (
                        <AddEquipmentForm
                          category={category}
                          categoryDisplayName={displayName}
                          supersedesOldSku={item.sku}
                          supersedesOldName={item.name}
                          defaultSpecs={item.specsJson ?? undefined}
                          defaultPrice={item.minPricePerUnit ?? undefined}
                        />
                      )}
                      <Link
                        href={`/cf-admin/assets/${item.sku}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-oc-border bg-oc-card hover:border-oc-muted hover:bg-oc-hover text-oc-fg-muted hover:text-oc-fg transition-all text-xs font-medium oc-shadow"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Add brand-new equipment to this category */}
                <div className="px-6 py-4 border-t border-oc-divide bg-oc-sunken">
                  <AddEquipmentForm
                    category={category}
                    categoryDisplayName={displayName}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
