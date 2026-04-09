import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  badge?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, description, action, badge, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl font-bold text-oc-fg tracking-[-0.02em] truncate">
            {title}
          </h1>
          {badge}
        </div>
        <div className="gradient-accent w-12 mt-2" />
        {description && (
          <p className="text-sm text-oc-fg-muted mt-2 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
