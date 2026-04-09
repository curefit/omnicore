"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, CheckSquare, Square, Minus, Plus, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  EQUIPMENT_CATALOG,
  CATEGORY_DISPLAY_NAMES,
  getModelGymItems,
  type ModelGymItem,
} from "@/lib/equipment/catalog"
import { computeGymTier, tierReason } from "@/lib/equipment/catalog"
import { TierBadge } from "@/components/equipment/TierBadge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface SelectedEquipmentItem {
  sku: string
  name: string
  category: string
  qty: number
  imageUrl?: string
}

interface Props {
  gymSqFt?: number | null
  totalUnits?: number | null
  selectedEquipment: SelectedEquipmentItem[]
  onChange: (items: SelectedEquipmentItem[]) => void
  onNext: () => void
  onBack: () => void
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}
        className="w-6 h-6 rounded border border-[#374151] bg-[#1f2937] text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-mono-metric text-white tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(20, value + 1))}
        className="w-6 h-6 rounded border border-[#374151] bg-[#1f2937] text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  )
}

export function StepEquipmentSelection({ gymSqFt, totalUnits, selectedEquipment, onChange, onNext, onBack }: Props) {
  const tier = computeGymTier(gymSqFt, totalUnits)
  const reason = tierReason(gymSqFt, totalUnits)

  // Group catalog items by category, but only show categories relevant to the tier
  const modelItems = useMemo(() => getModelGymItems(tier), [tier])
  const modelSkus = useMemo(() => new Set(modelItems.map(i => i.sku)), [modelItems])

  // All categories from the catalog
  const categories = useMemo(() => {
    const catMap = new Map<string, typeof EQUIPMENT_CATALOG>()
    for (const item of EQUIPMENT_CATALOG) {
      if (!catMap.has(item.category)) catMap.set(item.category, [])
      catMap.get(item.category)!.push(item)
    }
    // Show model gym categories first, then the rest
    const modelCats = new Set(modelItems.map(i => i.category))
    const orderedCats: string[] = []
    for (const cat of modelCats) if (catMap.has(cat)) orderedCats.push(cat)
    for (const cat of catMap.keys()) if (!modelCats.has(cat)) orderedCats.push(cat)
    return orderedCats.map(cat => ({ key: cat, items: catMap.get(cat)! }))
  }, [modelItems])

  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(modelItems.map(i => i.category))
  )

  const selMap = useMemo(() => {
    const m = new Map<string, SelectedEquipmentItem>()
    for (const s of selectedEquipment) m.set(s.sku, s)
    return m
  }, [selectedEquipment])

  const toggleItem = (sku: string, name: string, category: string, imageUrl?: string) => {
    if (selMap.has(sku)) {
      onChange(selectedEquipment.filter(s => s.sku !== sku))
    } else {
      const modelQty = modelItems.find(i => i.sku === sku)?.qty ?? 1
      onChange([...selectedEquipment, { sku, name, category, qty: modelQty, imageUrl }])
    }
  }

  const changeQty = (sku: string, qty: number) => {
    onChange(selectedEquipment.map(s => s.sku === sku ? { ...s, qty } : s))
  }

  const toggleCategory = (cat: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const totalQty = selectedEquipment.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Equipment Selection</h2>
        <p className="text-sm text-[#9ca3af]">
          Based on your gym size, we've pre-selected a recommended setup. Adjust quantities or add items as needed.
        </p>
      </div>

      <TierBadge tier={tier} reason={reason} categoryCount={categories.length} />

      <div className="space-y-3">
        {categories.map(({ key, items }) => {
          const open = openCats.has(key)
          const selectedInCat = selectedEquipment.filter(s => s.category === key)
          const isModelCat = modelItems.some(i => i.category === key)

          return (
            <div key={key} className={cn(
              "rounded-xl border overflow-hidden",
              isModelCat ? "border-[#1f2937] bg-[#111827]" : "border-[#1a2030] bg-[#0d1117]"
            )}>
              <button type="button" onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-[#1f2937] bg-[#0d1117] hover:bg-[#111827] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {items[0]?.imageUrl ? (
                    <img src={items[0].imageUrl} alt={key} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-[#1f2937] flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-3.5 h-3.5 text-[#6b7280]" />
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">
                      {CATEGORY_DISPLAY_NAMES[key] ?? key}
                      {isModelCat && (
                        <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Recommended
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#6b7280]">{items.length} options</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedInCat.length > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {selectedInCat.length} selected
                    </span>
                  )}
                  {open ? <ChevronUp className="w-4 h-4 text-[#6b7280]" /> : <ChevronDown className="w-4 h-4 text-[#6b7280]" />}
                </div>
              </button>

              {open && (
                <div className="divide-y divide-[#1f2937]">
                  {items.map(item => {
                    const sel = selMap.get(item.sku)
                    const isChecked = !!sel
                    const isModel = modelSkus.has(item.sku)

                    return (
                      <div key={item.sku}
                        onClick={() => toggleItem(item.sku, item.name, item.category, item.imageUrl)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                          isChecked ? "bg-cyan-500/5" : "hover:bg-[#0f1623]"
                        )}>
                        {isChecked
                          ? <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                          : <Square className="w-4 h-4 text-[#374151] shrink-0" />}

                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 opacity-80" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm truncate", isChecked ? "text-white" : "text-[#9ca3af]")}>
                            {item.name}
                            {isModel && !isChecked && (
                              <span className="ml-1.5 text-[10px] text-cyan-500/60">recommended</span>
                            )}
                          </p>
                          {item.specs && (
                            <p className="text-[11px] text-[#6b7280] truncate">{item.specs}</p>
                          )}
                        </div>

                        {isChecked && (
                          <QuantityStepper value={sel!.qty} onChange={(qty) => changeQty(item.sku, qty)} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sticky summary */}
      {selectedEquipment.length > 0 && (
        <div className="sticky bottom-4 rounded-xl border border-cyan-500/20 bg-[#0a0d14]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-[#9ca3af]">
            <span className="font-semibold text-white">{selectedEquipment.length}</span> items ·{" "}
            <span className="font-semibold text-white">{totalQty}</span> total units selected
          </span>
          <span className="text-[11px] text-cyan-400 font-medium">Request will be sent to CF Admin</span>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />Back
        </Button>
        <Button onClick={onNext}>
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
