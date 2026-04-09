"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface CatalogItem {
  sku: string
  name: string
  specsJson: string | null
  minPricePerUnit: number | null
  isLatestVersion: boolean
  supersedesSku: string | null
  version: number
}

interface Props {
  item: CatalogItem
  sameCategoryItems: { sku: string; name: string }[]
}

export function CatalogItemEditForm({ item, sameCategoryItems }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [minPrice, setMinPrice] = useState<string>(
    item.minPricePerUnit ? String(item.minPricePerUnit / 100) : ""
  )
  const [specs, setSpecs] = useState(item.specsJson ?? "")
  const [isLatest, setIsLatest] = useState(item.isLatestVersion)
  const [supersedesSku, setSupersedesSku] = useState(item.supersedesSku ?? "")

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/catalog/${encodeURIComponent(item.sku)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specsJson: specs.trim() || null,
          minPricePerUnit: minPrice ? Math.round(parseFloat(minPrice) * 100) : null,
          isLatestVersion: isLatest,
          supersedesSku: !isLatest && supersedesSku ? supersedesSku : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save")
      setSuccess(true)
      setTimeout(() => router.push("/cf-admin/assets"), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          Saved! Redirecting...
        </div>
      )}

      {/* Min price */}
      <div className="bg-oc-card rounded-xl border border-oc-border p-5 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-oc-fg-muted uppercase tracking-wider mb-1.5">
            Minimum Price per Unit (₹)
          </label>
          <p className="text-[11px] text-oc-fg-dim mb-2">
            Quote Builder will warn CF Admin if they quote below this price. Leave blank for no minimum.
          </p>
          <input
            type="number"
            className="form-input"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="e.g. 150000"
            min={0}
            step={1000}
          />
          {minPrice && (
            <p className="text-xs text-cyan-400 mt-1">
              = ₹{Number(minPrice).toLocaleString("en-IN")} per unit
            </p>
          )}
        </div>
      </div>

      {/* Specs */}
      <div className="bg-oc-card rounded-xl border border-oc-border p-5 space-y-2">
        <label className="block text-xs font-semibold text-oc-fg-muted uppercase tracking-wider">
          Specifications (display text)
        </label>
        <input
          type="text"
          className="form-input"
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder="e.g. 3HP AC Motor | 0–20 km/h | 150 kg max"
        />
      </div>

      {/* Version / superseded */}
      <div className="bg-oc-card rounded-xl border border-oc-border p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-oc-fg-muted uppercase tracking-wider mb-1.5">
            Version Status
          </label>
          <p className="text-[11px] text-oc-fg-dim mb-3">
            If a newer model exists in the same category, mark this as superseded. Centers using this item will see an upgrade ad in their Assets page.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsLatest(!isLatest)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isLatest ? "bg-cyan-500" : "bg-oc-muted"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isLatest ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <span className="text-sm text-oc-fg">
              {isLatest ? "Latest version" : "Superseded (older model)"}
            </span>
          </label>
        </div>

        {!isLatest && sameCategoryItems.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-oc-fg-muted uppercase tracking-wider mb-1.5">
              Superseded by (newer model SKU)
            </label>
            <select
              className="form-input"
              value={supersedesSku}
              onChange={(e) => setSupersedesSku(e.target.value)}
            >
              <option value="">— select newer model —</option>
              {sameCategoryItems.map((i) => (
                <option key={i.sku} value={i.sku}>
                  {i.sku} — {i.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.push("/cf-admin/assets")}
          className="px-4 py-2 text-sm text-oc-fg-muted hover:text-oc-fg border border-oc-border rounded-lg hover:border-oc-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
