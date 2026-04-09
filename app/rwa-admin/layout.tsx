"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/shared/Sidebar"

export default function RWAAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // No sidebar on the token gate entry page
  if (pathname === "/rwa-admin/join") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0d14]">
      <Sidebar role="rwa-admin" currentPath={pathname} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
