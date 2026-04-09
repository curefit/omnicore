"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, Minus, Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { EQUIPMENT_CATALOG, CATEGORY_DISPLAY_NAMES } from "@/lib/equipment/catalog"

interface EquipmentItem {
  sku: string
  name: string
  category: string
  qty: number
  imageUrl?: string
}

interface Props {
  leadId: string
  currentEquipment: EquipmentItem[]
}

export function QuoteRevisionForm({ leadId, currentEquipment }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [selection, setSelection] = useState<EquipmentItem[]>(
    currentEquipment.length > 0 ? currentEquipment : []
  )

  const selMap = new Map(selection.map((i) => [i.sku, i]))

  const toggleItem = (sku: string, name: string, category: string, imageUrl?: string) => {
    if (selMap.has(sku)) {
      setSelection((prev) => prev.filter((i) => i.sku !== sku))
    } else {
      setSelection((prev) => [...prev, { sku, name, category, qty: 1, imageUrl }])
    }
  }

  const changeQty = (sku: string, qty: number) => {
    setSelection((prev) => prev.map((i) => i.sku === sku ? { ...i, qty } : i))
  }

  const handleRevision = async () => {
    if (selection.length === 0) {
      setError("Select at least one equipment item before requesting changes.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/quote/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedEquipment: selection, notes: notes.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to send revision")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this negotiation? This cannot be undone.")) return
    setCancelling(true)
    try {
      await fetch(`/api/leads/${leadId}/quote/cancel`, { method: "POST" })
      router.refresh()
    } catch {
      setError("Failed to cancel")
    } finally {
      setCancelling(false)
    }
  }

  // Group catalog by category for the picker
  const catalogByCategory = new Map<string, typeof EQUIPMENT_CATALOG>()
  for (const item of EQUIPMENT_CATALOG) {
    if (!catalogByCategory.has(item.category)) catalogByCategory.set(item.category, [])
    catalogByCategory.get(item.category)!.push(item)
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-oc-border bg-oc-void hover:bg-oc-hover transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-oc-fg-soft">Request Equipment Changes</p>
          <p className="text-xs text-oc-fg-dim mt-0.5">
            Add or remove equipment from your selection, then send back to CF Admin for re-pricing
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-oc-fg-dim" /> : <ChevronDown className="w-4 h-4 text-oc-fg-dim" />}
      </button>

      {open && (
        <div className="rounded-xl border border-oc-border bg-oc-void overflow-hidden space-y-0">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border-b border-red-500/20 px-4 py-3">{error}</div>
          )}

          {/* Current selection summary */}
          {selection.length > 0 && (
            <div className="px-4 py-3 border-b border-oc-border bg-oc-deep">
              <p className="text-xs font-semibold text-oc-fg-dim uppercase tracking-wider mb-2">
                Selected ({selection.length} items)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selection.map((item) => (
                  <span key={item.sku} className="flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {item.qty}× {item.name.split(" CS-")[0].trim()}
                    <button type="button" onClick={() => toggleItem(item.sku, item.name, item.category)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-oc-divide">
            {Array.from(catalogByCategory.entries()).map(([cat, items]) => (
              <div key={cat}>
                <p className="px-4 py-2 text-[10px] font-bold text-oc-fg-dim uppercase tracking-wider bg-oc-deep">
                  {CATEGORY_DISPLAY_NAMES[cat] ?? cat}
                </p>
                {items.map((item) => {
                  const sel = selMap.get(item.sku)
                  const checked = !!sel
                  return (
                    <div
                      key={item.sku}
                      onClick={() => toggleItem(item.sku, item.name, item.category, item.imageUrl)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        checked ? "bg-cyan-500/5" : "hover:bg-oc-row-alt"
                      )}
                    >
                      {checked ? <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> : <Circle className="w-4 h-4 text-oc-muted shrink-0" />}
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-9 h-7 rounded-xl object-cover ring-1 ring-white/10 shadow-md shrink-0" />
                      )}
                      <span className={cn("text-xs flex-1 truncate", checked ? "text-oc-fg" : "text-oc-fg-muted")}>
                        {item.name}
                      </span>
                      {checked && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => changeQty(item.sku, Math.max(1, (sel?.qty ?? 1) - 1))}
                            className="w-5 h-5 rounded border border-oc-muted text-oc-fg-muted hover:text-oc-fg flex items-center justify-center">
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center text-xs text-oc-fg">{sel?.qty}</span>
                          <button onClick={() => changeQty(item.sku, (sel?.qty ?? 1) + 1)}
                            className="w-5 h-5 rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 flex items-center justify-center">
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Notes + send */}
          <div className="p-4 border-t border-oc-border space-y-3 bg-oc-deep">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Explain your changes (optional)..."
              className="form-input resize-none text-sm w-full"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleRevision}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? "Sending…" : "Send Revision Request →"}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-xs text-oc-fg-dim hover:text-red-400 border border-oc-border rounded-lg hover:border-red-500/30 transition-colors"
              >
                {cancelling ? "Cancelling…" : "Cancel Negotiation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
