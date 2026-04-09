"use client"

import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"

/**
 * Sidebar already includes ThemeToggle on CF / RWA admin shells.
 * Public flows (RWA setup, quote, join) get a floating control.
 */
export function GlobalThemeToggle() {
  const pathname = usePathname()

  const hasSidebar =
    pathname.startsWith("/cf-admin") ||
    (pathname.startsWith("/rwa-admin") && pathname !== "/rwa-admin/join")

  if (hasSidebar) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <ThemeToggle variant="icon" />
    </div>
  )
}
