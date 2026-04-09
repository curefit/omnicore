"use client"

import { useState } from "react"
import { formatPaise } from "@/lib/leads/quote"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"

interface Config {
  moduleKey: string
  pricingType: string
  defaultOneTimeFee: number | null
  defaultMonthlyFee: number | null
  defaultTakeRatePct: number | null
}

interface Props {
  configs: Config[]
}

export function PricingConfigTable({ configs }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localConfigs, setLocalConfigs] = useState(configs)

  const updateLocal = (moduleKey: string, field: string, value: number) => {
    setLocalConfigs((prev) =>
      prev.map((c) => (c.moduleKey === moduleKey ? { ...c, [field]: value } : c))
    )
  }

  const handleSave = async (moduleKey: string) => {
    setSaving(moduleKey)
    setError(null)
    const config = localConfigs.find((c) => c.moduleKey === moduleKey)
    if (!config) return

    try {
      const res = await fetch(`/api/pricing/${moduleKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultOneTimeFee: config.defaultOneTimeFee ?? undefined,
          defaultMonthlyFee: config.defaultMonthlyFee ?? undefined,
          defaultTakeRatePct: config.defaultTakeRatePct ?? undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-oc-void rounded-xl border border-oc-border overflow-hidden">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-6 py-3">
          {error}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="border-b border-oc-border">
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Module</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Type</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">One-time (₹)</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Monthly (₹)</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Take Rate (%)</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-oc-border">
          {localConfigs.map((config) => (
            <tr key={config.moduleKey}>
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-oc-fg-soft">{config.moduleKey}</p>
                <p className="text-xs text-oc-fg-dim">
                  {MODULE_PRICING_LABEL[config.moduleKey as keyof typeof MODULE_PRICING_LABEL]}
                </p>
              </td>
              <td className="px-6 py-4 text-sm text-oc-fg-dim">{config.pricingType}</td>
              <td className="px-6 py-4">
                {config.pricingType !== "MONTHLY" ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      className="form-input w-28 text-sm"
                      value={(config.defaultOneTimeFee ?? 0) / 100}
                      onChange={(e) =>
                        updateLocal(config.moduleKey, "defaultOneTimeFee", Math.round(parseFloat(e.target.value || "0") * 100))
                      }
                    />
                    <p className="text-xs text-oc-fg-dim">{formatPaise(config.defaultOneTimeFee ?? 0)}</p>
                  </div>
                ) : (
                  <span className="text-oc-fg-dim">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                {config.pricingType !== "ONE_TIME" ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      className="form-input w-28 text-sm"
                      value={(config.defaultMonthlyFee ?? 0) / 100}
                      onChange={(e) =>
                        updateLocal(config.moduleKey, "defaultMonthlyFee", Math.round(parseFloat(e.target.value || "0") * 100))
                      }
                    />
                    <p className="text-xs text-oc-fg-dim">{formatPaise(config.defaultMonthlyFee ?? 0)}</p>
                  </div>
                ) : (
                  <span className="text-oc-fg-dim">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                {config.pricingType === "ONE_TIME_PLUS_TAKE_RATE" ? (
                  <input
                    type="number"
                    className="form-input w-24 text-sm"
                    value={config.defaultTakeRatePct ?? 0}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(e) =>
                      updateLocal(config.moduleKey, "defaultTakeRatePct", parseFloat(e.target.value || "0"))
                    }
                  />
                ) : (
                  <span className="text-oc-fg-dim">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => handleSave(config.moduleKey)}
                  disabled={saving === config.moduleKey}
                  className="text-xs text-[#f97316] hover:text-[#ea6c0c] font-medium disabled:opacity-50"
                >
                  {saving === config.moduleKey ? "Saving…" : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
