"use client"

import { Users, Wrench, Package, Palette, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"
import { CENTER_MODULE_META, type CenterModuleKey } from "@/lib/constants/enums"

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Wrench,
  Package,
  Palette,
  Wifi,
}

interface ModuleSelectorProps {
  selected: CenterModuleKey[]
  onChange: (modules: CenterModuleKey[]) => void
  disabled?: boolean
}

export function ModuleSelector({ selected, onChange, disabled }: ModuleSelectorProps) {
  function toggle(key: CenterModuleKey) {
    if (disabled) return
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key))
    } else {
      onChange([...selected, key])
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CENTER_MODULE_META.map((module) => {
        const isSelected = selected.includes(module.key)
        const Icon = ICON_MAP[module.icon] ?? Wrench

        return (
          <button
            key={module.key}
            type="button"
            data-testid={`module-${module.key}`}
            data-selected={isSelected ? "true" : "false"}
            onClick={() => toggle(module.key)}
            disabled={disabled}
            className={cn(
              "relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
              isSelected
                ? "border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_0_1px_rgba(6,182,212,0.2)]"
                : "border-[#1f2937] bg-[#111827] hover:border-[#374151] hover:bg-[#1a2235]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Checkbox indicator */}
            <div
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                isSelected
                  ? "border-cyan-500 bg-cyan-500"
                  : "border-[#374151] bg-[#1f2937]"
              )}
            >
              {isSelected && (
                <svg
                  className="h-2.5 w-2.5 text-[#0a0d14]"
                  fill="none"
                  viewBox="0 0 10 10"
                >
                  <path
                    d="M1.5 5L3.5 7.5L8.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Icon */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                isSelected
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  : "border-[#374151] bg-[#1f2937] text-[#6b7280]"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? "text-white" : "text-[#f9fafb]"
                )}
              >
                {module.label}
              </p>
              <p className="mt-0.5 text-xs text-[#9ca3af] leading-relaxed">
                {module.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
