import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Accent = "cyan" | "purple" | "emerald" | "amber" | "red" | "blue"

const ACCENT_STYLES: Record<Accent, { icon: string; bar: string }> = {
  cyan:    { icon: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",    bar: "from-cyan-400 via-blue-500 to-purple-500" },
  blue:    { icon: "text-blue-400 bg-blue-500/10 border-blue-500/20",    bar: "from-blue-400 to-purple-500" },
  purple:  { icon: "text-purple-400 bg-purple-500/10 border-purple-500/20", bar: "from-purple-400 to-cyan-400" },
  emerald: { icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", bar: "from-emerald-400 to-cyan-400" },
  amber:   { icon: "text-amber-400 bg-amber-500/10 border-amber-500/20", bar: "from-amber-400 to-orange-500" },
  red:     { icon: "text-red-400 bg-red-500/10 border-red-500/20",       bar: "from-red-400 to-orange-500" },
}

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: Accent
  description?: string
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "cyan",
  description,
  trend,
  className,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent]
  const isPositiveTrend = trend && trend.value >= 0

  return (
    <div className={cn("rounded-xl border border-oc-border bg-oc-card overflow-hidden oc-shadow", className)}>
      {/* Gradient top accent bar */}
      <div className={cn("h-px w-full bg-gradient-to-r", styles.bar)} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] font-semibold text-oc-fg-dim uppercase tracking-wider">
            {label}
          </span>
          <div className={cn("flex items-center justify-center w-7 h-7 rounded-md border", styles.icon)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>

        <p className="text-3xl font-bold font-mono-metric text-oc-fg leading-none mb-1">
          {value}
        </p>

        {(description || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium", isPositiveTrend ? "text-emerald-400" : "text-red-400")}>
                {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositiveTrend ? "+" : ""}{trend.value}%
              </span>
            )}
            {trend && <span className="text-xs text-oc-fg-dim">{trend.label}</span>}
            {description && !trend && <span className="text-xs text-oc-fg-muted">{description}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
