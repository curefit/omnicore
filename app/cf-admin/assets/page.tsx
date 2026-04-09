import { prisma } from "@/lib/db/client"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import { formatPaise } from "@/lib/leads/quote"
import { SectionHeader } from "@/components/shared/SectionHeader"
import Link from "next/link"
import { Pencil, AlertCircle, ArrowUpCircle, Wrench } from "lucide-react"

async function getCatalog() {
  return prisma.equipmentCatalogItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] })
}

export default async function CFAdminAssetsPage() {
  const items = await getCatalog()

  // Group by category
  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    if (!grouped.has(item.category)) grouped.set(item.category, [])
    grouped.get(item.category)!.push(item)
  }

  const totalWithPrice = items.filter((i) => i.minPricePerUnit != null).length

  return (
    <div className="p-8 space-y-6">
      <SectionHeader
        title="Equipment Catalog"
        description="Manage Cultsport equipment catalog, minimum prices, and version tracking."
        action={
          <div className="flex items-center gap-2 text-xs text-[#6b7280]">
            <span className="text-white font-semibold">{items.length}</span> items ·{" "}
            <span className="text-white font-semibold">{totalWithPrice}</span> priced
          </div>
        }
      />

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([category, catItems]) => {
          const heroImage = catItems[0]?.imageUrl
          const displayName = CATEGORY_DISPLAY_NAMES[category] ?? category

          return (
            <div key={category} className="rounded-2xl border border-[#1f2937] overflow-hidden">
              {/* Category header with hero image */}
              <div className="relative h-20 overflow-hidden bg-[#0d1117]">
                {heroImage && (
                  <img src={heroImage} alt={displayName} className="w-full h-full object-cover object-center opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/95 via-[#0a0d14]/70 to-transparent flex items-center px-5 gap-3">
                  <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{displayName}</h3>
                    <p className="text-[11px] text-[#6b7280]">{catItems.length} products</p>
                  </div>
                </div>
              </div>

              {/* Items table */}
              <div className="divide-y divide-[#1a2030]">
                {catItems.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-[#0f1623] transition-colors"
                  >
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-9 rounded-lg object-cover shrink-0 border border-[#1f2937]"
                      />
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-[#1f2937] flex items-center justify-center shrink-0">
                        <Wrench className="w-3.5 h-3.5 text-[#6b7280]" />
                      </div>
                    )}

                    {/* Name + SKU + specs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        {!item.isLatestVersion && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Superseded
                          </span>
                        )}
                        {item.supersedesSku && (
                          <span className="text-[10px] text-[#6b7280]">
                            → replaced by {item.supersedesSku}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6b7280] font-mono">{item.sku}</p>
                      {item.specsJson && (
                        <p className="text-[11px] text-[#4b5563] truncate mt-0.5">{item.specsJson}</p>
                      )}
                    </div>

                    {/* Min price */}
                    <div className="text-right shrink-0 min-w-[110px]">
                      {item.minPricePerUnit ? (
                        <p className="text-sm font-semibold text-white">
                          {formatPaise(item.minPricePerUnit)}
                        </p>
                      ) : (
                        <p className="text-xs text-[#4b5563]">— no price set</p>
                      )}
                      <p className="text-[10px] text-[#6b7280]">min / unit</p>
                    </div>

                    {/* Edit button */}
                    <Link
                      href={`/cf-admin/assets/${item.sku}/edit`}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1f2937] bg-[#111827] hover:border-[#374151] hover:bg-[#1a2235] text-[#9ca3af] hover:text-white transition-all text-xs font-medium"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
