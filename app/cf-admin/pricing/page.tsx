import { prisma } from "@/lib/db/client"
import { PricingConfigTable } from "@/components/leads/PricingConfigTable"
import { formatPaise } from "@/lib/leads/quote"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import { SectionHeader } from "@/components/shared/SectionHeader"
import Link from "next/link"
import { ExternalLink, Package } from "lucide-react"

export default async function PricingPage() {
  const [configs, highlightItems, totalItems] = await Promise.all([
    prisma.servicePricingConfig.findMany({ orderBy: { moduleKey: "asc" } }),
    prisma.equipmentCatalogItem.findMany({
      where: { isHighlight: true, minPricePerUnit: { not: null } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 12,
    }),
    prisma.equipmentCatalogItem.count(),
  ])

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Default Pricing"
        description="Service module defaults are pre-filled in the quote builder. Equipment min prices are enforced per item."
      />

      {/* Service pricing */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-oc-fg-muted uppercase tracking-wider">Service Modules</h2>
        <PricingConfigTable configs={configs} />
      </section>

      {/* Equipment minimum prices */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-oc-fg-muted uppercase tracking-wider">Equipment Minimum Prices</h2>
          <Link
            href="/cf-admin/assets"
            className="flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Manage full catalog
          </Link>
        </div>

        {highlightItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-oc-border p-8 text-center oc-shadow">
            <p className="text-sm text-oc-fg-dim">
              No equipment prices set yet.{" "}
              <Link href="/cf-admin/assets" className="text-cyan-500 hover:underline">
                Go to Assets catalog
              </Link>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-oc-border overflow-hidden oc-shadow">
            <div className="divide-y divide-oc-border">
              {highlightItems.map((item) => (
                <div key={item.sku} className="flex items-center gap-4 px-5 py-3.5 hover:bg-oc-hover transition-colors">
                  {item.imageUrl ? (
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-oc-deep border border-oc-border">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-oc-deep border border-oc-border flex items-center justify-center">
                      <Package className="w-4 h-4 text-oc-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-oc-fg truncate">{item.name}</p>
                    <p className="text-[11px] text-oc-fg-dim">{CATEGORY_DISPLAY_NAMES[item.category] ?? item.category} · {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono-metric text-oc-fg">{formatPaise(item.minPricePerUnit!)}</p>
                    <p className="text-[10px] text-oc-fg-dim">min / unit</p>
                  </div>
                  <Link
                    href={`/cf-admin/assets/${item.sku}/edit`}
                    className="text-xs text-oc-fg-dim hover:text-cyan-400 transition-colors shrink-0"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-oc-border bg-oc-deep flex justify-between items-center">
              <p className="text-[11px] text-oc-fg-dim">Showing highlighted items only</p>
              <Link href="/cf-admin/assets" className="text-xs text-cyan-500 hover:underline">
                View all {totalItems} items
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
