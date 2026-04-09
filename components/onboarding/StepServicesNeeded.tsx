"use client"

import { useState } from "react"
import { CheckSquare, Square, Wrench, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { EQUIPMENT_CATALOG, UPGRADE_HIGHLIGHTS, CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"
import { Button } from "@/components/ui/button"
import { type SelectedEquipmentItem } from "./StepEquipmentSelection"

interface Props {
  selectedEquipment: SelectedEquipmentItem[]
  onChange: (items: SelectedEquipmentItem[]) => void
  onNext: () => void
  onBack: () => void
}

// Build upgrade catalog: 4-5 sections, 2-3 options each from the highlights
const UPGRADE_SECTIONS = Object.entries(UPGRADE_HIGHLIGHTS).map(([label, skus]) => ({
  label,
  items: skus
    .map(sku => EQUIPMENT_CATALOG.find(i => i.sku === sku))
    .filter((i): i is NonNullable<typeof i> => !!i),
}))

export function StepServicesNeeded({ selectedEquipment, onChange, onNext, onBack }: Props) {
  const selSet = new Set(selectedEquipment.map(i => i.sku))

  const toggleItem = (sku: string, name: string, category: string, imageUrl?: string) => {
    if (selSet.has(sku)) {
      onChange(selectedEquipment.filter(s => s.sku !== sku))
    } else {
      onChange([...selectedEquipment, { sku, name, category, qty: 1, imageUrl }])
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-oc-fg mb-1">Equipment Upgrade</h2>
        <p className="text-sm text-oc-fg-muted">
          Select the equipment you'd like to add or upgrade. CultSport will include pricing in the quote.
        </p>
      </div>

      <div className="space-y-4">
        {UPGRADE_SECTIONS.map(({ label, items }) => (
          <div key={label} className="rounded-xl border border-oc-border bg-oc-card overflow-hidden">
            <div className="px-4 py-3 border-b border-oc-border bg-oc-deep">
              <div className="flex items-center gap-3">
                {items[0]?.imageUrl ? (
                  <img src={items[0].imageUrl} alt={label}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/10 shadow-md shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-oc-border flex items-center justify-center shrink-0">
                    <Wrench className="w-3.5 h-3.5 text-oc-fg-dim" />
                  </div>
                )}
                <p className="text-sm font-semibold text-oc-fg">{label}</p>
              </div>
            </div>
            <div className="divide-y divide-oc-border">
              {items.map(item => {
                const checked = selSet.has(item.sku)
                return (
                  <div key={item.sku}
                    onClick={() => toggleItem(item.sku, item.name, item.category, item.imageUrl)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      checked ? "bg-cyan-500/5" : "hover:bg-oc-row-alt"
                    )}>
                    {checked
                      ? <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      : <Square className="w-4 h-4 text-oc-muted shrink-0" />}

                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-white/10 shadow-lg" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", checked ? "text-oc-fg" : "text-oc-fg-muted")}>
                        {item.name}
                      </p>
                      {item.specs && (
                        <p className="text-[11px] text-oc-fg-dim truncate">{item.specs}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedEquipment.length > 0 && (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5">
          <p className="text-xs text-cyan-400">
            <span className="font-semibold">{selectedEquipment.length}</span> upgrade{selectedEquipment.length !== 1 ? "s" : ""} selected — CF Admin will include pricing in the quote.
          </p>
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
