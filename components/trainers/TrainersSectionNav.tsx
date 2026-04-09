"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/cf-admin/trainers/hiring", label: "Hiring pipeline", key: "hiring" as const },
  { href: "/cf-admin/trainers/l0", label: "L0 training", key: "l0" as const },
  { href: "/cf-admin/trainers/available", label: "Available to map", key: "available" as const },
  { href: "/cf-admin/trainers/mapped", label: "Assigned to centers", key: "mapped" as const },
]

function sectionActive(
  pathname: string,
  key: (typeof TABS)[number]["key"]
): boolean {
  if (key === "hiring") {
    if (pathname === "/cf-admin/trainers") return true
    if (pathname.startsWith("/cf-admin/trainers/hiring")) return true
    if (pathname.startsWith("/cf-admin/trainers/l0")) return false
    if (pathname.startsWith("/cf-admin/trainers/available")) return false
    if (pathname.startsWith("/cf-admin/trainers/mapped")) return false
    const m = pathname.match(/^\/cf-admin\/trainers\/([^/]+)$/)
    if (m?.[1] && !["hiring", "l0", "available", "mapped"].includes(m[1])) return true
    return false
  }
  if (key === "l0") {
    return pathname === "/cf-admin/trainers/l0" || pathname.startsWith("/cf-admin/trainers/l0/")
  }
  if (key === "available") {
    return pathname.startsWith("/cf-admin/trainers/available")
  }
  if (key === "mapped") {
    return pathname.startsWith("/cf-admin/trainers/mapped")
  }
  return false
}

export function TrainersSectionNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-oc-border mb-8">
      <p className="text-xs text-oc-fg-dim mb-3 max-w-3xl">
        <strong className="text-oc-fg-muted">Hiring</strong> ends at offer acceptance.{" "}
        <strong className="text-oc-fg-muted">L0</strong> is post-offer training.{" "}
        <strong className="text-oc-fg-muted">Roster / assignments</strong> are the live{" "}
        <code className="text-oc-fg-dim">Trainer</code> pool and center mappings — not part of hiring or L0.
      </p>
      <nav className="flex flex-wrap gap-1" aria-label="Trainers sections">
        {TABS.map((tab) => {
          const isActive = sectionActive(pathname, tab.key)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
                  : "text-oc-fg-muted hover:text-oc-fg-soft hover:bg-oc-hover"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
