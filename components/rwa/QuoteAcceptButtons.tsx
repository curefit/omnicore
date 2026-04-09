"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  leadId: string
  inviteToken: string
}

export function QuoteAcceptButtons({ leadId, inviteToken }: Props) {
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
      await fetch("/api/rwa/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      }).catch(() => {})
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
        <p className="text-oc-fg-soft font-medium">Quote accepted!</p>
        <p className="text-sm text-oc-fg-dim">
          Your gym setup is confirmed. The CultSport team will be in touch soon.
        </p>
        <Link
          href="/rwa-admin"
          className="btn-primary mt-4"
        >
          Open your dashboard
        </Link>
      </div>
    )
  }

  if (done === "rejected") {
    return (
      <div className="text-center space-y-3">
        <p className="text-oc-fg-dim text-sm">
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
      <p className="text-sm text-oc-fg-dim text-center">
        By accepting, you agree to the pricing above and authorize CultSport to proceed with setup.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={rejecting || accepting}
          className="btn-secondary flex-1"
        >
          {rejecting ? "Declining…" : "Decline"}
        </button>
        <button
          onClick={handleAccept}
          disabled={accepting || rejecting}
          className="btn-primary flex-1"
        >
          {accepting ? "Accepting…" : "Accept Quote & Confirm"}
        </button>
      </div>
    </div>
  )
}
