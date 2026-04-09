import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  badge?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title,
  description,
  action,
  badge,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-display text-xl font-bold text-white tracking-tight truncate">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-[#9ca3af] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
