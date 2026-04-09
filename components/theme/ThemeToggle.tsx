"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  /** Full-width row with label (sidebar). Icon-only for compact corners. */
  variant?: "full" | "icon"
  className?: string
}

export function ThemeToggle({ variant = "full", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-md border border-oc-border bg-transparent",
          variant === "full" ? "h-9 w-full" : "h-9 w-9 shrink-0",
          className
        )}
        aria-hidden
      />
    )
  }

  const isDark = resolvedTheme !== "light"
  const label = isDark ? "Switch to light theme" : "Switch to dark theme"

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-oc-border text-oc-fg-muted hover:bg-oc-hover hover:text-oc-fg transition-colors shadow-sm bg-oc-card/80 backdrop-blur-sm",
          className
        )}
        aria-label={label}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-9 w-full items-center justify-center gap-2 rounded-md border border-oc-border text-sm text-oc-fg-muted hover:bg-oc-hover hover:text-oc-fg transition-colors",
        className
      )}
      aria-label={label}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 shrink-0" />
          <span className="truncate">Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" />
          <span className="truncate">Dark mode</span>
        </>
      )}
    </button>
  )
}
