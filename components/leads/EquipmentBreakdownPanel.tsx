import { formatPaise } from "@/lib/leads/quote"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface EquipmentItem {
  sku: string
  name: string
  category: string
  qty: number
  imageUrl?: string
}

interface CatalogPriceItem {
  sku: string
  minPricePerUnit: number | null
}

interface Props {
  items: EquipmentItem[]
  catalogItems: CatalogPriceItem[]
  totalAssetFee: number | null
}

export function EquipmentBreakdownPanel({ items, catalogItems, totalAssetFee }: Props) {
  const [open, setOpen] = useState(false)

  if (!items || items.length === 0) return null

  const priceMap = new Map<string, number>(
    catalogItems.filter((c) => c.minPricePerUnit != null).map((c) => [c.sku, c.minPricePerUnit!])
  )

  const catalogMinimum = items.reduce((sum, item) => {
    const unitPrice = priceMap.get(item.sku) ?? 0
    return sum + unitPrice * item.qty
  }, 0)

  const isBelowMinimum = totalAssetFee != null && catalogMinimum > 0 && totalAssetFee < catalogMinimum

  return (
    <div className="mt-2 rounded-xl border border-oc-divide bg-oc-deep overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-oc-card transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-oc-fg-dim uppercase tracking-wider">
            Equipment Breakdown ({items.length} items)
          </span>
          {isBelowMinimum && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-2.5 h-2.5" />
              Below catalog minimum
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-oc-fg-dim" /> : <ChevronDown className="w-3.5 h-3.5 text-oc-fg-dim" />}
      </button>

      {open && (
        <div className="border-t border-oc-divide">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-oc-divide">
                <th className="text-left px-4 py-2 text-oc-fg-dim font-semibold uppercase tracking-wider">Equipment</th>
                <th className="text-center px-3 py-2 text-oc-fg-dim font-semibold uppercase tracking-wider">Qty</th>
                <th className="text-right px-4 py-2 text-oc-fg-dim font-semibold uppercase tracking-wider">Min / unit</th>
                <th className="text-right px-4 py-2 text-oc-fg-dim font-semibold uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oc-divide">
              {items.map((item) => {
                const unitMin = priceMap.get(item.sku)
                const subtotal = unitMin ? unitMin * item.qty : null
                return (
                  <tr key={item.sku} className="hover:bg-oc-card/50">
                    <td className="px-4 py-2 text-oc-fg-soft flex items-center gap-2">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-7 h-5 rounded-lg object-cover ring-1 ring-white/10 shadow-sm" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-oc-fg-muted">×{item.qty}</td>
                    <td className="px-4 py-2 text-right text-oc-fg-muted">
                      {unitMin ? formatPaise(unitMin) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-oc-fg-soft font-medium">
                      {subtotal ? formatPaise(subtotal) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-oc-muted bg-oc-card/50">
                <td colSpan={3} className="px-4 py-2 text-oc-fg-dim text-right font-semibold">Catalog Minimum Total</td>
                <td className={`px-4 py-2 text-right font-bold text-sm ${isBelowMinimum ? "text-amber-400" : "text-oc-fg"}`}>
                  {catalogMinimum > 0 ? formatPaise(catalogMinimum) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
