"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, Minus, Plus, Wrench, CheckCircle2, Circle } from "lucide-react"
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
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-7 h-7 rounded-full border border-[#374151] bg-[#1f2937] text-[#9ca3af] hover:bg-[#374151] hover:text-white flex items-center justify-center transition-all"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-bold text-white tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        className="w-7 h-7 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 flex items-center justify-center transition-all"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  )
}

function CategoryCard({
  catKey,
  items,
  isModelCat,
  open,
  selectedInCat,
  selMap,
  modelSkus,
  onToggle,
  onToggleItem,
  onChangeQty,
}: {
  catKey: string
  items: typeof EQUIPMENT_CATALOG
  isModelCat: boolean
  open: boolean
  selectedInCat: SelectedEquipmentItem[]
  selMap: Map<string, SelectedEquipmentItem>
  modelSkus: Set<string>
  onToggle: () => void
  onToggleItem: (sku: string, name: string, category: string, imageUrl?: string) => void
  onChangeQty: (sku: string, qty: number) => void
}) {
  const heroImage = items[0]?.imageUrl
  const heroImage2 = items[0]?.imageUrl2
  const selectedCount = selectedInCat.length

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-200",
        isModelCat
          ? "border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.06)]"
          : "border border-[#1f2937]",
        open ? "shadow-lg" : ""
      )}
    >
      {/* ── Category Hero Header ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left relative group overflow-hidden"
      >
        {/* Hero image with gradient overlay */}
        {heroImage ? (
          <div className="relative h-28 overflow-hidden">
            <img
              src={heroImage}
              alt={catKey}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/95 via-[#0a0d14]/60 to-transparent" />
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a0d14] to-transparent" />

            {/* Content over the image */}
            <div className="absolute inset-0 flex items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-white leading-tight">
                      {CATEGORY_DISPLAY_NAMES[catKey] ?? catKey}
                    </p>
                    {isModelCat && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">{items.length} options available</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedCount > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
                    {selectedCount} selected
                  </span>
                )}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border transition-colors",
                  open ? "bg-[#1f2937] border-[#374151]" : "bg-[#1f2937]/60 border-[#374151]/60"
                )}>
                  {open
                    ? <ChevronUp className="w-3.5 h-3.5 text-[#9ca3af]" />
                    : <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback header without image */
          <div className="h-16 bg-[#0d1117] flex items-center justify-between px-5 border-b border-[#1f2937]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1f2937] border border-[#374151] flex items-center justify-center">
                <Wrench className="w-4 h-4 text-[#6b7280]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{CATEGORY_DISPLAY_NAMES[catKey] ?? catKey}</p>
                <p className="text-[11px] text-[#6b7280]">{items.length} options</p>
              </div>
            </div>
            {open ? <ChevronUp className="w-4 h-4 text-[#6b7280]" /> : <ChevronDown className="w-4 h-4 text-[#6b7280]" />}
          </div>
        )}
      </button>

      {/* ── Equipment Items List ─────────────────────────────────────────────── */}
      {open && (
        <div className="bg-[#0a0d14] divide-y divide-[#1a2030]">
          {items.map((item) => {
            const sel = selMap.get(item.sku)
            const isChecked = !!sel
            const isModel = modelSkus.has(item.sku)

            return (
              <div
                key={item.sku}
                onClick={() => onToggleItem(item.sku, item.name, item.category, item.imageUrl)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-150 group",
                  isChecked
                    ? "bg-gradient-to-r from-cyan-500/[0.07] to-transparent"
                    : "hover:bg-[#0f1623]"
                )}
              >
                {/* Checkbox icon */}
                <div className="shrink-0">
                  {isChecked
                    ? <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    : <Circle className="w-5 h-5 text-[#2d3748] group-hover:text-[#4a5568]" />}
                </div>

                {/* Equipment image — larger, with depth effects */}
                {item.imageUrl && (
                  <div className={cn(
                    "relative shrink-0 w-[72px] h-[52px] rounded-xl overflow-hidden border transition-all duration-200",
                    isChecked
                      ? "border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      : "border-[#1f2937] opacity-70 group-hover:opacity-90"
                  )}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#0a0d14]/40" />
                    {/* Checked overlay glow */}
                    {isChecked && (
                      <div className="absolute inset-0 ring-1 ring-inset ring-cyan-400/20 rounded-xl" />
                    )}
                  </div>
                )}

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium leading-snug transition-colors",
                    isChecked ? "text-white" : "text-[#9ca3af] group-hover:text-[#d1d5db]"
                  )}>
                    {item.name}
                    {isModel && !isChecked && (
                      <span className="ml-2 text-[10px] text-cyan-500/50 font-normal">✦ recommended</span>
                    )}
                  </p>
                  {item.specs && (
                    <p className="text-[11px] text-[#4b5563] mt-0.5 truncate leading-relaxed">
                      {item.specs}
                    </p>
                  )}
                </div>

                {/* Quantity stepper — only when selected */}
                {isChecked && (
                  <QuantityStepper
                    value={sel!.qty}
                    onChange={(qty) => onChangeQty(item.sku, qty)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function StepEquipmentSelection({
  gymSqFt,
  totalUnits,
  selectedEquipment,
  onChange,
  onNext,
  onBack,
}: Props) {
  const tier = computeGymTier(gymSqFt, totalUnits)
  const reason = tierReason(gymSqFt, totalUnits)

  const modelItems = useMemo(() => getModelGymItems(tier), [tier])
  const modelSkus = useMemo(() => new Set(modelItems.map((i) => i.sku)), [modelItems])

  const categories = useMemo(() => {
    const catMap = new Map<string, typeof EQUIPMENT_CATALOG>()
    for (const item of EQUIPMENT_CATALOG) {
      if (!catMap.has(item.category)) catMap.set(item.category, [])
      catMap.get(item.category)!.push(item)
    }
    const modelCats = new Set(modelItems.map((i) => i.category))
    const orderedCats: string[] = []
    for (const cat of modelCats) if (catMap.has(cat)) orderedCats.push(cat)
    for (const cat of catMap.keys()) if (!modelCats.has(cat)) orderedCats.push(cat)
    return orderedCats.map((cat) => ({ key: cat, items: catMap.get(cat)! }))
  }, [modelItems])

  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(modelItems.map((i) => i.category))
  )

  const selMap = useMemo(() => {
    const m = new Map<string, SelectedEquipmentItem>()
    for (const s of selectedEquipment) m.set(s.sku, s)
    return m
  }, [selectedEquipment])

  const toggleItem = (sku: string, name: string, category: string, imageUrl?: string) => {
    if (selMap.has(sku)) {
      onChange(selectedEquipment.filter((s) => s.sku !== sku))
    } else {
      const modelQty = modelItems.find((i) => i.sku === sku)?.qty ?? 1
      onChange([...selectedEquipment, { sku, name, category, qty: modelQty, imageUrl }])
    }
  }

  const changeQty = (sku: string, qty: number) => {
    onChange(selectedEquipment.map((s) => (s.sku === sku ? { ...s, qty } : s)))
  }

  const toggleCategory = (cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const totalQty = selectedEquipment.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Equipment Selection</h2>
        <p className="text-sm text-[#9ca3af]">
          Based on your gym size, we've pre-selected a recommended setup. Adjust or add items as needed.
        </p>
      </div>

      <TierBadge tier={tier} reason={reason} categoryCount={categories.length} />

      {/* Category cards */}
      <div className="space-y-3">
        {categories.map(({ key, items }) => (
          <CategoryCard
            key={key}
            catKey={key}
            items={items}
            isModelCat={modelItems.some((i) => i.category === key)}
            open={openCats.has(key)}
            selectedInCat={selectedEquipment.filter((s) => s.category === key)}
            selMap={selMap}
            modelSkus={modelSkus}
            onToggle={() => toggleCategory(key)}
            onToggleItem={toggleItem}
            onChangeQty={changeQty}
          />
        ))}
      </div>

      {/* Sticky selection summary */}
      {selectedEquipment.length > 0 && (
        <div className="sticky bottom-4 z-10 rounded-2xl border border-cyan-500/25 bg-[#0a0d14]/90 backdrop-blur-md px-5 py-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div>
            <p className="text-sm font-semibold text-white">
              {selectedEquipment.length} items &nbsp;·&nbsp; {totalQty} units
            </p>
            <p className="text-[11px] text-cyan-400/70 mt-0.5">Request will be sent to CF Admin</p>
          </div>
          <div className="flex items-center gap-1.5">
            {selectedEquipment.slice(0, 4).map((item) =>
              item.imageUrl ? (
                <img
                  key={item.sku}
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-7 h-7 rounded-lg object-cover border border-cyan-500/30 shadow-[0_0_6px_rgba(6,182,212,0.2)]"
                />
              ) : null
            )}
            {selectedEquipment.length > 4 && (
              <span className="w-7 h-7 rounded-lg bg-[#1f2937] border border-[#374151] flex items-center justify-center text-[10px] text-[#9ca3af]">
                +{selectedEquipment.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
