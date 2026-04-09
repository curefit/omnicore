"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  NAV_BY_ROLE,
  ROLE_LABELS,
  ROLE_SWITCH_TARGET,
  type Role,
} from "@/lib/constants/navigation"
import { ArrowLeftRight } from "lucide-react"

interface SidebarProps {
  role: Role
  currentPath: string
}

export function Sidebar({ role, currentPath }: SidebarProps) {
  const navItems = NAV_BY_ROLE[role]
  const roleLabel = ROLE_LABELS[role]
  const switchTarget = ROLE_SWITCH_TARGET[role]
  const isRwaAdmin = role === "rwa-admin"

  return (
    <aside className="flex flex-col h-screen w-60 shrink-0 border-r border-[#1f2937] bg-[#0d1117]">
      {/* ── Brand ── */}
      <div className="flex flex-col gap-3 px-5 py-5 border-b border-[#1f2937]">
        <Image
          src="/brand/omnicore-mark.png"
          alt="OmniCore"
          width={40}
          height={40}
          className="h-10 w-auto max-w-[120px] object-contain object-left"
          priority
        />
        <Image
          src="/brand/omnicore-fullname.png"
          alt=""
          width={200}
          height={48}
          className="w-full max-w-[200px] h-auto object-contain object-left opacity-95"
          aria-hidden
        />
      </div>

      {/* ── Role pill ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1f2937] text-[#9ca3af] border border-[#374151]">
            {roleLabel}
          </span>
          {isRwaAdmin && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide">
              READ ONLY
            </span>
          )}
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== `/${role}` && currentPath.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-[#9ca3af] hover:bg-[#1a2235] hover:text-[#f9fafb]"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Role switcher ── */}
      <div className="px-3 pb-5 pt-3 border-t border-[#1f2937]">
        <Link
          href={switchTarget.href}
          data-testid="role-switcher-link"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-[#9ca3af] hover:bg-[#1a2235] hover:text-[#f9fafb] transition-colors border border-[#1f2937] hover:border-[#374151]"
        >
          <ArrowLeftRight className="w-4 h-4 shrink-0" />
          <span className="truncate">{switchTarget.label}</span>
        </Link>
      </div>
    </aside>
  )
}
