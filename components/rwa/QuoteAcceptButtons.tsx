"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  leadId: string
}

export function QuoteAcceptButtons({ leadId }: Props) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/quote/accept`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to accept quote")
      setDone("accepted")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/quote/reject`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to reject quote")
      setDone("rejected")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setRejecting(false)
    }
  }

  if (done === "accepted") {
    return (
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <span className="text-emerald-400 text-xl">✓</span>
        </div>
        <p className="text-[#e5e7eb] font-medium">Quote accepted!</p>
        <p className="text-sm text-[#6b7280]">
          Your gym setup is confirmed. The CultSport team will be in touch soon.
        </p>
      </div>
    )
  }

  if (done === "rejected") {
    return (
      <div className="text-center space-y-3">
        <p className="text-[#6b7280] text-sm">
          You have declined this quote. The CultSport team will reach out if you change your mind.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      <p className="text-sm text-[#6b7280] text-center">
        By accepting, you agree to the pricing above and authorize CultSport to proceed with setup.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={rejecting || accepting}
          className="flex-1 py-2.5 bg-[#1f2937] text-[#e5e7eb] text-sm font-medium rounded-lg hover:bg-[#374151] disabled:opacity-50 transition-colors"
        >
          {rejecting ? "Declining…" : "Decline"}
        </button>
        <button
          onClick={handleAccept}
          disabled={accepting || rejecting}
          className="flex-1 py-2.5 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] disabled:opacity-50 transition-colors"
        >
          {accepting ? "Accepting…" : "Accept Quote & Confirm"}
        </button>
      </div>
    </div>
  )
}
