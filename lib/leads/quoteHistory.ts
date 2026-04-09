// Quote history — append-only log of all state changes on a Quote.
// Stored as JSON array in Quote.historyJson.

export type QuoteAction =
  | "CF_DRAFT_SAVED"
  | "CF_QUOTE_SENT"
  | "CF_QUOTE_REVISED"
  | "RWA_REVISION_REQUESTED"
  | "RWA_ACCEPTED"
  | "RWA_REJECTED"
  | "RWA_CANCELLED"

export interface QuoteHistoryEntry {
  round: number
  action: QuoteAction
  actorRole: "CF_ADMIN" | "RWA_ADMIN"
  notes?: string
  // Snapshot of line item totals at this point (paise)
  snapshot?: {
    totalOneTime?: number
    totalMonthly?: number
    totalAmount?: number
    quoteMode?: string
    equipmentCount?: number
  }
  ts: string // ISO timestamp
}

export function parseHistory(historyJson: string | null | undefined): QuoteHistoryEntry[] {
  if (!historyJson) return []
  try {
    return JSON.parse(historyJson) as QuoteHistoryEntry[]
  } catch {
    return []
  }
}

export function appendHistory(
  current: string | null | undefined,
  entry: Omit<QuoteHistoryEntry, "ts">
): string {
  const history = parseHistory(current)
  history.push({ ...entry, ts: new Date().toISOString() })
  return JSON.stringify(history)
}

export const ACTION_LABEL: Record<QuoteAction, string> = {
  CF_DRAFT_SAVED: "Quote drafted",
  CF_QUOTE_SENT: "Quote sent to RWA Admin",
  CF_QUOTE_REVISED: "Quote revised and re-sent",
  RWA_REVISION_REQUESTED: "RWA Admin requested changes",
  RWA_ACCEPTED: "Quote accepted",
  RWA_REJECTED: "Quote rejected",
  RWA_CANCELLED: "Negotiation cancelled",
}

export const ACTION_COLOR: Record<QuoteAction, string> = {
  CF_DRAFT_SAVED: "text-oc-fg-dim",
  CF_QUOTE_SENT: "text-[#f97316]",
  CF_QUOTE_REVISED: "text-cyan-400",
  RWA_REVISION_REQUESTED: "text-amber-400",
  RWA_ACCEPTED: "text-emerald-400",
  RWA_REJECTED: "text-red-400",
  RWA_CANCELLED: "text-red-400",
}

export const ACTION_DOT: Record<QuoteAction, string> = {
  CF_DRAFT_SAVED: "bg-oc-fg-dim",
  CF_QUOTE_SENT: "bg-[#f97316]",
  CF_QUOTE_REVISED: "bg-cyan-400",
  RWA_REVISION_REQUESTED: "bg-amber-400",
  RWA_ACCEPTED: "bg-emerald-400",
  RWA_REJECTED: "bg-red-400",
  RWA_CANCELLED: "bg-red-400",
}
