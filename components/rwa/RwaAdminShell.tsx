"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function RwaLogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/rwa/session", { method: "DELETE" })
    router.push("/rwa-admin/join")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-oc-fg-muted hover:bg-oc-hover hover:text-oc-fg transition-colors"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      <span>Log out</span>
    </button>
  )
}

export function RwaAdminShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
