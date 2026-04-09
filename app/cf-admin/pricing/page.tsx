import { prisma } from "@/lib/db/client"
import { PricingConfigTable } from "@/components/leads/PricingConfigTable"
import { formatPaise } from "@/lib/leads/quote"
import { CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import Link from "next/link"
import { ExternalLink, Wrench } from "lucide-react"

export default async function PricingPage() {
  const [configs, highlightItems] = await Promise.all([
    prisma.servicePricingConfig.findMany({ orderBy: { moduleKey: "asc" } }),
    prisma.equipmentCatalogItem.findMany({
      where: { isHighlight: true, minPricePerUnit: { not: null } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 12,
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#e5e7eb]">Default Pricing</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Service module defaults are pre-filled in the quote builder. Equipment min prices are enforced per item.
        </p>
      </div>

      {/* Service pricing */}
      <section>
        <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">Service Modules</h2>
        <PricingConfigTable configs={configs} />
      </section>

      {/* Equipment minimum prices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider">Equipment Minimum Prices</h2>
          <Link
            href="/cf-admin/assets"
            className="flex items-center gap-1.5 text-xs text-[#f97316] hover:text-[#ea6c0c] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Manage full catalog
          </Link>
        </div>

        {highlightItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1f2937] p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              No equipment prices set yet.{" "}
              <Link href="/cf-admin/assets" className="text-[#f97316] hover:underline">
                Go to Assets catalog →
              </Link>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937] overflow-hidden">
            <div className="divide-y divide-[#1f2937]">
              {highlightItems.map((item) => (
                <div key={item.sku} className="flex items-center gap-4 px-5 py-3 hover:bg-[#111827] transition-colors">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-7 rounded object-cover border border-[#1f2937] shrink-0" />
                  ) : (
                    <div className="w-10 h-7 rounded bg-[#1f2937] flex items-center justify-center shrink-0">
                      <Wrench className="w-3 h-3 text-[#6b7280]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e5e7eb] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#6b7280]">{CATEGORY_DISPLAY_NAMES[item.category] ?? item.category} · {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatPaise(item.minPricePerUnit!)}</p>
                    <p className="text-[10px] text-[#6b7280]">min / unit</p>
                  </div>
                  <Link
                    href={`/cf-admin/assets/${item.sku}/edit`}
                    className="text-xs text-[#6b7280] hover:text-[#f97316] transition-colors shrink-0"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#1f2937] bg-[#0d1117] flex justify-between items-center">
              <p className="text-[11px] text-[#6b7280]">Showing highlighted items only</p>
              <Link href="/cf-admin/assets" className="text-xs text-[#f97316] hover:underline">
                View all {await prisma.equipmentCatalogItem.count()} items →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
