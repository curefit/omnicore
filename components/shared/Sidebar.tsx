"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { NAV_BY_ROLE, ROLE_LABELS, ROLE_SWITCH_TARGET, type Role } from "@/lib/constants/navigation"
import { ArrowLeftRight } from "lucide-react"
import { OmniAvatar } from "./OmniMascot"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

interface SidebarProps {
  role: Role
  currentPath: string
  endSlot?: React.ReactNode
}

export function Sidebar({ role, currentPath, endSlot }: SidebarProps) {
  const navItems = NAV_BY_ROLE[role]
  const roleLabel = ROLE_LABELS[role]
  const switchTarget = ROLE_SWITCH_TARGET[role]
  const isRwaAdmin = role === "rwa-admin"

  return (
    <aside className="flex flex-col h-screen w-60 shrink-0 border-r border-oc-border bg-oc-deep">
      {/* Logo — same bg as aside (no inner gradient); circular clip hides asset fringe */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-oc-border">
        <div className="relative shrink-0 size-8 rounded-full overflow-hidden ring-1 ring-cyan-500/35 bg-oc-deep">
          <OmniAvatar size="xs" className="rounded-none ring-0 object-cover size-8" />
        </div>
        <div>
          <span className="font-display text-base font-bold tracking-[-0.02em] text-oc-fg block leading-tight">
            OmniCore
          </span>
          <span className="text-[9px] text-cyan-400/60 tracking-[0.12em] uppercase font-medium">
            Gym Ops
          </span>
        </div>
      </div>

      {/* Role pill */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-oc-border text-oc-fg-muted border border-oc-muted">
            {roleLabel}
          </span>
          {isRwaAdmin && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide">
              READ ONLY
            </span>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto font-ui">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== `/${role}` && currentPath.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
                isActive
                  ? "border-l-2 border-cyan-400 pl-[calc(0.75rem-1px)] bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-300 light:text-cyan-700"
                  : "text-oc-fg-muted hover:bg-oc-hover hover:text-oc-fg border-l-2 border-transparent"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Role switcher + optional end slot */}
      <div className="px-3 pb-5 pt-3 border-t border-oc-border space-y-1">
        <ThemeToggle />
        {endSlot}
        <Link
          href={switchTarget.href}
          data-testid="role-switcher-link"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-oc-fg-muted hover:bg-oc-hover hover:text-oc-fg transition-colors border border-oc-border hover:border-oc-muted"
        >
          <ArrowLeftRight className="w-4 h-4 shrink-0" />
          <span className="truncate">{switchTarget.label}</span>
        </Link>
      </div>
    </aside>
  )
}
