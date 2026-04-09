import { type LucideIcon, Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1f2937] border border-[#374151] mb-4">
        <Icon className="w-5 h-5 text-[#6b7280]" />
      </div>
      <p className="text-sm font-medium text-[#f9fafb] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-[#6b7280] max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
