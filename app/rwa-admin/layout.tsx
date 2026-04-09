"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/shared/Sidebar"
import { OmniGhostBackground } from "@/components/shared/OmniMascot"
import { RwaLogoutButton } from "@/components/rwa/RwaAdminShell"

export default function RWAAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === "/rwa-admin/join") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-oc-base">
      <Sidebar
        role="rwa-admin"
        currentPath={pathname}
        endSlot={<RwaLogoutButton />}
      />
      <main className="relative flex-1 overflow-y-auto">
        <OmniGhostBackground opacity={5} />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
