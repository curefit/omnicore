import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  align?: "left" | "center" | "right"
  className?: string
  headerClassName?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
  className?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data",
  className,
  onRowClick,
}: DataTableProps<T>) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-xl border border-[#1f2937] bg-[#111827]", className)}>
        <div className="flex items-center justify-center py-14">
          <p className="text-sm text-[#6b7280]">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-xl border border-[#1f2937] bg-[#111827] overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2937]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]",
                    alignClass[col.align ?? "left"],
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2937]">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "transition-colors",
                  onRowClick
                    ? "cursor-pointer hover:bg-[#1a2235]"
                    : "hover:bg-[#111827]/80"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-[#f9fafb]",
                      alignClass[col.align ?? "left"],
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
