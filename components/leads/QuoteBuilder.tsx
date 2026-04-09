"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatPaise } from "@/lib/leads/quote"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"
import { EquipmentBreakdownPanel } from "./EquipmentBreakdownPanel"

interface PricingConfig {
  moduleKey: string
  pricingType: string
  defaultOneTimeFee: number | null
  defaultMonthlyFee: number | null
  defaultTakeRatePct: number | null
}

interface LineItem {
  moduleKey: string
  pricingType: string
  oneTimeFee: number | null
  monthlyFee: number | null
  takeRatePct: number | null
}

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
  leadId: string
  selectedModules: string[]
  pricingConfigs: PricingConfig[]
  selectedEquipment?: EquipmentItem[]
  catalogItems?: CatalogPriceItem[]
  existingQuote: {
    id: string
    status: string
    notes: string | null
    lineItems: LineItem[]
    quoteMode?: string
    totalAmount?: number | null
    revisionRound?: number
  } | null
}

export function QuoteBuilder({ leadId, selectedModules, pricingConfigs, selectedEquipment = [], catalogItems = [], existingQuote }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState(existingQuote?.notes ?? "")
  const [quoteMode, setQuoteMode] = useState<"ITEMIZED" | "TOTAL">(
    (existingQuote?.quoteMode as "ITEMIZED" | "TOTAL") ?? "ITEMIZED"
  )
  const [totalAmount, setTotalAmount] = useState<number>(
    existingQuote?.totalAmount ? existingQuote.totalAmount / 100 : 0
  )

  const configByModule = Object.fromEntries(pricingConfigs.map((c) => [c.moduleKey, c]))

  // Compute catalog minimum for ASSETS: sum(minPricePerUnit × qty) across selected equipment
  const catalogMinimumForAssets = selectedEquipment.reduce((sum, item) => {
    const cat = catalogItems.find((c) => c.sku === item.sku)
    return sum + (cat?.minPricePerUnit ?? 0) * item.qty
  }, 0)

  const initLineItems = () =>
    selectedModules.map((moduleKey) => {
      const cfg = configByModule[moduleKey]
      const existing = existingQuote?.lineItems.find((li) => li.moduleKey === moduleKey)
      // For ASSETS: if no existing quote yet, pre-fill with catalog minimum (if available)
      const assetsDefault = moduleKey === "ASSETS" && !existingQuote && catalogMinimumForAssets > 0
        ? catalogMinimumForAssets
        : (cfg?.defaultOneTimeFee ?? 0)
      return {
        moduleKey,
        pricingType: cfg?.pricingType ?? "MONTHLY",
        oneTimeFee: existing?.oneTimeFee ?? (moduleKey === "ASSETS" ? assetsDefault : (cfg?.defaultOneTimeFee ?? 0)),
        monthlyFee: existing?.monthlyFee ?? cfg?.defaultMonthlyFee ?? 0,
        takeRatePct: existing?.takeRatePct ?? cfg?.defaultTakeRatePct ?? 0,
      }
    })

  const [lineItems, setLineItems] = useState(initLineItems)

  const updateItem = (moduleKey: string, field: string, value: number) => {
    setLineItems((prev) =>
      prev.map((li) =>
        li.moduleKey === moduleKey ? { ...li, [field]: value } : li
      )
    )
  }

  const totalOneTime = lineItems.reduce((sum, li) => sum + (li.oneTimeFee ?? 0), 0)
  const totalMonthly = lineItems.reduce((sum, li) => sum + (li.monthlyFee ?? 0), 0)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          quoteMode,
          totalAmount: quoteMode === "TOTAL" ? Math.round(totalAmount * 100) : undefined,
          lineItems: lineItems.map((li) => ({
            moduleKey: li.moduleKey,
            pricingType: li.pricingType,
            oneTimeFee: li.oneTimeFee || undefined,
            monthlyFee: li.monthlyFee || undefined,
            takeRatePct: li.takeRatePct || undefined,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save quote")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      throw e // re-throw so callers like handleSend can abort
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    setError(null)
    try {
      await handleSave()
      const res = await fetch(`/api/leads/${leadId}/quote/send`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to send quote")
      router.push(`/cf-admin/leads/${leadId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Pricing mode toggle */}
      <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-4">
        <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-3">Pricing Mode</p>
        <div className="flex gap-3">
          {(["ITEMIZED", "TOTAL"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setQuoteMode(mode)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                quoteMode === mode
                  ? "bg-[#f97316]/10 border-[#f97316] text-[#f97316]"
                  : "bg-transparent border-[#1f2937] text-[#6b7280] hover:border-[#374151]"
              }`}
            >
              {mode === "ITEMIZED" ? "Per Item" : "Agreed Total Amount"}
            </button>
          ))}
        </div>
        {quoteMode === "TOTAL" && (
          <div className="mt-3 space-y-1">
            <label className="text-xs text-[#9ca3af]">Total agreed amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={totalAmount}
              min={0}
              step={1000}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value || "0"))}
              placeholder="e.g. 750000"
            />
            <p className="text-[11px] text-[#6b7280]">
              Individual module prices will be hidden in the RWA quote — only this total will be shown.
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#111111] rounded-xl border border-[#1f2937] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1f2937]">
          <h2 className="text-sm font-medium text-[#e5e7eb]">
            {quoteMode === "TOTAL" ? "Modules Included (amounts hidden from RWA)" : "Line Items"}
          </h2>
        </div>

        <div className="divide-y divide-[#1f2937]">
          {lineItems.map((li) => (
            <div key={li.moduleKey}>
              <QuoteLineItemRow item={li} onUpdate={updateItem} readOnly={quoteMode === "TOTAL"} />
              {li.moduleKey === "ASSETS" && selectedEquipment.length > 0 && (
                <div className="px-6 pb-3">
                  <EquipmentBreakdownPanel
                    items={selectedEquipment}
                    catalogItems={catalogItems}
                    totalAssetFee={li.oneTimeFee}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-[#1f2937] bg-[#0a0a0a] space-y-1">
          {quoteMode === "TOTAL" && totalAmount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280]">Total Agreed Amount</span>
              <span className="text-[#e5e7eb] font-semibold">{formatPaise(Math.round(totalAmount * 100))}</span>
            </div>
          ) : (
            <>
              {totalOneTime > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Total One-time</span>
                  <span className="text-[#e5e7eb] font-medium">{formatPaise(totalOneTime)}</span>
                </div>
              )}
              {totalMonthly > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Total Monthly</span>
                  <span className="text-[#e5e7eb] font-medium">{formatPaise(totalMonthly)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="form-input resize-none"
          placeholder="Any special terms or comments for the RWA Admin…"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-[#1f2937] text-[#e5e7eb] text-sm font-medium rounded-lg hover:bg-[#374151] disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save Draft"}
        </button>
        <button
          onClick={handleSend}
          disabled={sending || loading}
          className="px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] disabled:opacity-50 transition-colors"
        >
          {sending ? "Sending…" : "Send Quote to RWA Admin"}
        </button>
      </div>
    </div>
  )
}

interface QuoteLineItemRowProps {
  item: {
    moduleKey: string
    pricingType: string
    oneTimeFee: number | null
    monthlyFee: number | null
    takeRatePct: number | null
  }
  onUpdate: (moduleKey: string, field: string, value: number) => void
  readOnly?: boolean
}

function QuoteLineItemRow({ item, onUpdate, readOnly }: QuoteLineItemRowProps) {
  const label = MODULE_PRICING_LABEL[item.moduleKey as keyof typeof MODULE_PRICING_LABEL] ?? item.moduleKey

  return (
    <div className="px-6 py-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[120px]">
        <p className="text-sm font-medium text-[#e5e7eb]">{item.moduleKey}</p>
        <p className="text-xs text-[#6b7280]">{label}</p>
      </div>

      {!readOnly && (item.pricingType === "ONE_TIME" || item.pricingType === "ONE_TIME_PLUS_TAKE_RATE") && (
        <div className="space-y-0.5">
          <label className="text-xs text-[#6b7280]">One-time (₹)</label>
          <input
            type="number"
            className="form-input w-32 text-sm"
            value={(item.oneTimeFee ?? 0) / 100}
            onChange={(e) => onUpdate(item.moduleKey, "oneTimeFee", Math.round(parseFloat(e.target.value || "0") * 100))}
          />
        </div>
      )}

      {!readOnly && (item.pricingType === "MONTHLY" || item.pricingType === "ONE_TIME_PLUS_TAKE_RATE") && (
        <div className="space-y-0.5">
          <label className="text-xs text-[#6b7280]">Monthly (₹)</label>
          <input
            type="number"
            className="form-input w-32 text-sm"
            value={(item.monthlyFee ?? 0) / 100}
            onChange={(e) => onUpdate(item.moduleKey, "monthlyFee", Math.round(parseFloat(e.target.value || "0") * 100))}
          />
        </div>
      )}

      {!readOnly && item.pricingType === "ONE_TIME_PLUS_TAKE_RATE" && (
        <div className="space-y-0.5">
          <label className="text-xs text-[#6b7280]">Take Rate (%)</label>
          <input
            type="number"
            className="form-input w-24 text-sm"
            value={item.takeRatePct ?? 0}
            min={0}
            max={100}
            step={0.5}
            onChange={(e) => onUpdate(item.moduleKey, "takeRatePct", parseFloat(e.target.value || "0"))}
          />
        </div>
      )}

      {readOnly && (
        <span className="text-xs text-[#374151] italic">included in total</span>
      )}
    </div>
  )
}
