import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  Ticket,
  DollarSign,
  Activity,
  ClipboardList,
  Filter,
  type LucideIcon,
} from "lucide-react"

export type Role = "cf-admin" | "rwa-admin"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const CF_ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/cf-admin", icon: LayoutDashboard },
  { label: "Leads", href: "/cf-admin/leads", icon: Filter },
  { label: "Onboarding", href: "/cf-admin/onboarding", icon: Building2 },
  { label: "Pricing", href: "/cf-admin/pricing", icon: DollarSign },
  { label: "Trainers", href: "/cf-admin/trainers", icon: Users },
  { label: "Assets", href: "/cf-admin/assets", icon: Wrench },
  { label: "Service Requests", href: "/cf-admin/service-requests", icon: Ticket },
]

export const RWA_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/rwa-admin", icon: Activity },
  { label: "Trainer Attendance", href: "/rwa-admin/attendance", icon: ClipboardList },
  { label: "Assets", href: "/rwa-admin/assets", icon: Wrench },
  { label: "Service Requests", href: "/rwa-admin/service-requests", icon: Ticket },
]

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  "cf-admin": CF_ADMIN_NAV,
  "rwa-admin": RWA_ADMIN_NAV,
}

export const ROLE_LABELS: Record<Role, string> = {
  "cf-admin": "CF Admin",
  "rwa-admin": "RWA Admin",
}

export const ROLE_SWITCH_TARGET: Record<Role, { href: string; label: string }> = {
  "cf-admin": { href: "/rwa-admin", label: "Switch to RWA Admin" },
  "rwa-admin": { href: "/cf-admin", label: "Switch to CF Admin" },
}
