import { cn } from "@/lib/utils"
import { type GymTier, TIER_LABEL } from "@/lib/equipment/catalog"
import { Building2 } from "lucide-react"

const TIER_STYLES: Record<GymTier, { badge: string; icon: string; glow: string }> = {
  SMALL: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    glow: "shadow-[0_0_0_3px_rgba(245,158,11,0.08)]",
  },
  MEDIUM: {
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    glow: "shadow-[0_0_0_3px_rgba(6,182,212,0.08)]",
  },
  LARGE: {
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    glow: "shadow-[0_0_0_3px_rgba(168,85,247,0.08)]",
  },
}

interface TierBadgeProps {
  tier: GymTier
  reason?: string
  categoryCount?: number
  className?: string
}

export function TierBadge({ tier, reason, categoryCount, className }: TierBadgeProps) {
  const styles = TIER_STYLES[tier]

  return (
    <div className={cn(
      "flex items-start gap-4 rounded-xl border border-[#1f2937] bg-[#111827] p-4",
      styles.glow,
      className
    )}>
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg border shrink-0",
        styles.icon
      )}>
        <Building2 className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border",
            styles.badge
          )}>
            {TIER_LABEL[tier]}
          </span>
          {categoryCount !== undefined && (
            <span className="text-[11px] text-[#6b7280]">
              {categoryCount} equipment {categoryCount === 1 ? "category" : "categories"}
            </span>
          )}
        </div>
        {reason && (
          <p className="text-xs text-[#6b7280] mt-1">{reason}</p>
        )}
      </div>
    </div>
  )
}
