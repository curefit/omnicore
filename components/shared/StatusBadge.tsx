import { cn } from "@/lib/utils"

interface StatusConfig {
  label: string
  className: string
  dotClassName?: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Asset condition
  GOOD: {
    label: "Good",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClassName: "bg-emerald-400",
  },
  FAIR: {
    label: "Fair",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
  POOR: {
    label: "Poor",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dotClassName: "bg-red-400",
  },
  // Service request status
  OPEN: {
    label: "Open",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dotClassName: "bg-red-400",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dotClassName: "bg-cyan-400",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClassName: "bg-emerald-400",
  },
  // Attendance status
  PRESENT: {
    label: "Present",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClassName: "bg-emerald-400",
  },
  ABSENT: {
    label: "Absent",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dotClassName: "bg-red-400",
  },
  LATE: {
    label: "Late",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
  // Center status
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClassName: "bg-emerald-400",
  },
  ONBOARDING: {
    label: "Onboarding",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dotClassName: "bg-purple-400",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-oc-border/80 text-oc-fg-dim border-oc-muted",
    dotClassName: "bg-oc-fg-dim",
  },
  // Lead funnel status
  INVITED: {
    label: "Invited",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotClassName: "bg-blue-400",
  },
  FORM_SUBMITTED: {
    label: "Form Submitted",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dotClassName: "bg-cyan-400",
  },
  QUOTE_SENT: {
    label: "Quote Sent",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dotClassName: "bg-red-400",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClassName: "bg-emerald-400",
  },
  // Quote status
  DRAFT: {
    label: "Draft",
    className: "bg-oc-border/80 text-oc-fg-muted border-oc-muted",
    dotClassName: "bg-oc-fg-muted",
  },
  SENT: {
    label: "Sent",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
  // Trainer type
  FULLTIME: {
    label: "Full-time",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dotClassName: "bg-cyan-400",
  },
  PT: {
    label: "PT",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dotClassName: "bg-purple-400",
  },
  // Attendance source
  MYGATE: {
    label: "MyGate",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  OTP: {
    label: "OTP",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  MANUAL: {
    label: "Manual",
    className: "bg-oc-border/80 text-oc-fg-muted border-oc-muted",
  },
  // Priority
  LOW: {
    label: "Low",
    className: "bg-oc-border/80 text-oc-fg-muted border-oc-muted",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  CRITICAL: {
    label: "Critical",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
}

interface StatusBadgeProps {
  status: string
  showDot?: boolean
  className?: string
  size?: "sm" | "md"
}

export function StatusBadge({
  status,
  showDot = false,
  className,
  size = "sm",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const label = config?.label ?? status
  const badgeClass = config?.className ?? "bg-oc-border text-oc-fg-muted border-oc-muted"
  const dotClass = config?.dotClassName

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full font-medium",
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        badgeClass,
        className
      )}
    >
      {showDot && dotClass && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClass)} />
      )}
      {label}
    </span>
  )
}
