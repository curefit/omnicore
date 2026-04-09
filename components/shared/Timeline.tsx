import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type TimelineAccent = "cyan" | "emerald" | "amber" | "red" | "purple" | "default"

const ACCENT_DOT: Record<TimelineAccent, string> = {
  cyan: "bg-cyan-400 border-cyan-400/30",
  emerald: "bg-emerald-400 border-emerald-400/30",
  amber: "bg-amber-400 border-amber-400/30",
  red: "bg-red-400 border-red-400/30",
  purple: "bg-purple-400 border-purple-400/30",
  default: "bg-oc-muted border-oc-muted",
}

const ACCENT_BADGE: Record<TimelineAccent, string> = {
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  default: "bg-oc-border text-oc-fg-muted border-oc-muted",
}

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: Date | string
  badge?: string
  accent?: TimelineAccent
  icon?: LucideIcon
  meta?: string
}

interface TimelineProps {
  items: TimelineItem[]
  emptyMessage?: string
  className?: string
}

function formatTimestamp(ts: Date | string): string {
  const date = typeof ts === "string" ? new Date(ts) : ts
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function Timeline({ items, emptyMessage = "No events", className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn("py-10 text-center", className)}>
        <p className="text-sm text-oc-fg-dim">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ol className={cn("space-y-0", className)} role="list">
      {items.map((item, idx) => {
        const accent = item.accent ?? "default"
        const Icon = item.icon
        const isLast = idx === items.length - 1

        return (
          <li key={item.id} className="relative flex gap-3 pb-0">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-oc-border" />
            )}

            {/* Dot / Icon */}
            <div className="shrink-0 mt-1">
              {Icon ? (
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border",
                    ACCENT_DOT[accent]
                  )}
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full border-2 mt-1 ml-0.5",
                    ACCENT_DOT[accent]
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-oc-fg font-medium leading-snug">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-oc-fg-muted mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-mono-metric text-[11px] text-oc-fg-dim">
                    {formatTimestamp(item.timestamp)}
                  </span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                        ACCENT_BADGE[accent]
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
              {item.meta && (
                <p className="text-[11px] text-oc-fg-dim mt-1">{item.meta}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
