import {
  parseHistory,
  ACTION_LABEL,
  ACTION_COLOR,
  ACTION_DOT,
  type QuoteHistoryEntry,
} from "@/lib/leads/quoteHistory"
import { formatPaise } from "@/lib/leads/quote"

interface Props {
  historyJson: string | null | undefined
  className?: string
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

export function QuoteHistoryTimeline({ historyJson, className }: Props) {
  const history = parseHistory(historyJson)
  if (history.length === 0) return null

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-oc-fg-dim uppercase tracking-wider mb-3">
        Quote History
      </p>
      <ol className="space-y-0">
        {history.map((entry, idx) => {
          const isLast = idx === history.length - 1
          return (
            <li key={idx} className="relative flex gap-3 pb-0">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[5px] top-4 bottom-0 w-px bg-oc-border" />
              )}
              {/* Dot */}
              <div className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${ACTION_DOT[entry.action]}`} />
              {/* Content */}
              <div className="flex-1 pb-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${ACTION_COLOR[entry.action]}`}>
                      {ACTION_LABEL[entry.action]}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-oc-fg-muted mt-0.5 italic">&ldquo;{entry.notes}&rdquo;</p>
                    )}
                    {entry.snapshot && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {entry.snapshot.totalOneTime != null && entry.snapshot.totalOneTime > 0 && (
                          <span className="text-[11px] text-oc-fg-dim">
                            One-time: <span className="text-oc-fg-soft">{formatPaise(entry.snapshot.totalOneTime)}</span>
                          </span>
                        )}
                        {entry.snapshot.totalMonthly != null && entry.snapshot.totalMonthly > 0 && (
                          <span className="text-[11px] text-oc-fg-dim">
                            Monthly: <span className="text-oc-fg-soft">{formatPaise(entry.snapshot.totalMonthly)}</span>
                          </span>
                        )}
                        {entry.snapshot.totalAmount != null && entry.snapshot.totalAmount > 0 && (
                          <span className="text-[11px] text-oc-fg-dim">
                            Total: <span className="text-[#f97316] font-semibold">{formatPaise(entry.snapshot.totalAmount)}</span>
                          </span>
                        )}
                        {entry.snapshot.equipmentCount != null && (
                          <span className="text-[11px] text-oc-fg-dim">
                            {entry.snapshot.equipmentCount} items
                          </span>
                        )}
                      </div>
                    )}
                    {entry.round > 0 && (
                      <span className="text-[10px] text-oc-placeholder mt-0.5 block">Round {entry.round}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-oc-placeholder shrink-0">{formatTs(entry.ts)}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
