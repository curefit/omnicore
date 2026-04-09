import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Accent = "cyan" | "purple" | "emerald" | "amber" | "red"

const ACCENT_STYLES: Record<Accent, { icon: string; trend: string }> = {
  cyan: {
    icon: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    trend: "text-cyan-400",
  },
  purple: {
    icon: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    trend: "text-purple-400",
  },
  emerald: {
    icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    trend: "text-emerald-400",
  },
  amber: {
    icon: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    trend: "text-amber-400",
  },
  red: {
    icon: "text-red-400 bg-red-500/10 border-red-500/20",
    trend: "text-red-400",
  },
}

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: Accent
  description?: string
  trend?: {
    value: number
    label: string
  }
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
    <div
      className={cn(
        "rounded-xl border border-[#1f2937] bg-[#111827] p-5",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md border",
            styles.icon
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <p className="text-3xl font-bold font-mono-metric text-white leading-none mb-1">
        {value}
      </p>

      {(description || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                isPositiveTrend ? "text-emerald-400" : "text-red-400"
              )}
            >
              {isPositiveTrend ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositiveTrend ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {trend && (
            <span className="text-xs text-[#6b7280]">{trend.label}</span>
          )}
          {description && !trend && (
            <span className="text-xs text-[#9ca3af]">{description}</span>
          )}
        </div>
      )}
    </div>
  )
}
