"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react"

interface Props {
  category: string
  categoryDisplayName: string
  // If set: this is "New Version" mode — will supersede the old SKU on save
  supersedesOldSku?: string
  supersedesOldName?: string
  // Pre-fill values from the old item
  defaultSpecs?: string
  defaultPrice?: number
}

export function AddEquipmentForm({
  category,
  categoryDisplayName,
  supersedesOldSku,
  supersedesOldName,
  defaultSpecs,
  defaultPrice,
}: Props) {
  const router = useRouter()
  const isUpgradeMode = !!supersedesOldSku
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sku, setSku] = useState("")
  const [name, setName] = useState("")
  const [series, setSeries] = useState("")
  const [specs, setSpecs] = useState(defaultSpecs ?? "")
  const [minPrice, setMinPrice] = useState(defaultPrice ? String(defaultPrice / 100) : "")
  const [isHighlight, setIsHighlight] = useState(false)

  const handleSave = async () => {
    if (!sku.trim() || !name.trim()) {
      setError("SKU and Name are required")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          category,
          series: series.trim() || undefined,
          specsJson: specs.trim() || undefined,
          minPricePerUnit: minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined,
          isHighlight,
          supersedesOldSku: supersedesOldSku || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to add")
      setSaved(true)
      setTimeout(() => {
        setOpen(false)
        setSaved(false)
        setSku(""); setName(""); setSeries(""); setSpecs(""); setMinPrice(""); setIsHighlight(false)
        router.refresh()
      }, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
          isUpgradeMode
            ? "text-cyan-400 border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5"
            : "text-oc-fg-dim border-dashed border-oc-muted hover:border-[#f97316] hover:text-[#f97316]"
        }`}
      >
        <Plus className="w-3 h-3" />
        {isUpgradeMode ? `Add New Version` : `Add to ${categoryDisplayName}`}
      </button>
    )
  }

  return (
    <div className={`rounded-xl border bg-oc-deep overflow-hidden ${isUpgradeMode ? "border-cyan-500/30" : "border-oc-border"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isUpgradeMode ? "border-cyan-500/20 bg-cyan-500/5" : "border-oc-border bg-oc-card"}`}>
        <div>
          <p className="text-xs font-semibold text-oc-fg">
            {isUpgradeMode ? "Add New Version" : `Add to ${categoryDisplayName}`}
          </p>
          {isUpgradeMode && supersedesOldName && (
            <p className="text-[10px] text-cyan-400/70 mt-0.5">
              Will supersede: {supersedesOldName} ({supersedesOldSku})
            </p>
          )}
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-oc-fg-dim hover:text-oc-fg">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-oc-fg-dim uppercase tracking-wider mb-1">SKU *</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. CS-NEW-001"
              className="form-input text-xs uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-oc-fg-dim uppercase tracking-wider mb-1">Series</label>
            <select value={series} onChange={(e) => setSeries(e.target.value)} className="form-input text-xs">
              <option value="">— none —</option>
              <option value="FLOW">Flow</option>
              <option value="FLUX">Flux</option>
              <option value="FUEL">Fuel</option>
              <option value="FORCE">Force</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-oc-fg-dim uppercase tracking-wider mb-1">Product Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Commercial Treadmill Pro 2025"
            className="form-input text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-oc-fg-dim uppercase tracking-wider mb-1">Key Specs</label>
          <input
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            placeholder="e.g. 5HP Motor | 0-22 km/h | 200 kg max"
            className="form-input text-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-oc-fg-dim uppercase tracking-wider mb-1">Min Price / Unit (₹)</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="e.g. 185000"
            min={0}
            step={1000}
            className="form-input text-sm"
          />
          {minPrice && (
            <p className="text-[10px] text-cyan-400 mt-0.5">= ₹{Number(minPrice).toLocaleString("en-IN")}</p>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isHighlight}
            onChange={(e) => setIsHighlight(e.target.checked)}
            className="w-3.5 h-3.5 accent-cyan-500"
          />
          <span className="text-xs text-oc-fg-muted">Include in model gym recommendations</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-xs text-oc-fg-dim border border-oc-border rounded-lg hover:border-oc-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {saved ? (
              <><CheckCircle2 className="w-3 h-3" />Added!</>
            ) : saving ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Saving…</>
            ) : (
              <><Plus className="w-3 h-3" />Add Equipment</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
