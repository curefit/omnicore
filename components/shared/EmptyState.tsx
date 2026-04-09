import { type LucideIcon } from "lucide-react"
import { OmniMascot, type MascotVariant } from "./OmniMascot"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  /** Swap the icon for a mascot variant. Defaults to "empty" */
  mascot?: MascotVariant | false
}

export function EmptyState({
  title,
  description,
  action,
  mascot = "empty",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {mascot !== false ? (
        <OmniMascot variant={mascot} size="lg" className="mb-2 opacity-90" />
      ) : null}
      <p className="text-sm font-medium text-oc-fg mb-1">{title}</p>
      {description && (
        <p className="text-xs text-oc-fg-dim max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
