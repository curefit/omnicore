import { notFound } from "next/navigation"
import { RWASetupShell } from "@/components/rwa/RWASetupShell"

interface Props {
  params: Promise<{ token: string }>
}

export default async function RWASetupPage({ params }: Props) {
  const { token } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/leads/token/${token}`,
    { cache: "no-store" }
  )

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const message = json.error ?? "Invalid or expired invite link"
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-2xl">✕</span>
          </div>
          <h1 className="text-xl font-semibold text-[#e5e7eb]">Link Error</h1>
          <p className="text-sm text-[#6b7280]">{message}</p>
        </div>
      </div>
    )
  }

  const { lead } = await res.json()

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center mx-auto">
            <span className="text-[#f97316] text-lg font-bold">O</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#e5e7eb]">Set up your gym</h1>
          <p className="text-sm text-[#6b7280]">
            Welcome, {lead.contactName}! Complete the form below to set up your CultSport gym at{" "}
            <strong className="text-[#e5e7eb]">{lead.societyName}</strong>.
          </p>
        </div>
        <RWASetupShell leadId={lead.id} token={token} societyName={lead.societyName} />
      </div>
    </div>
  )
}
