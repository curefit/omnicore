"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OmniMascot } from "@/components/shared/OmniMascot"

export default function RWAJoinPage() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Accept either the full URL or just the raw token
  const extractToken = (value: string): string => {
    const trimmed = value.trim()
    const match = trimmed.match(/\/rwa\/setup\/([a-f0-9]+)/)
    if (match) return match[1]
    const matchQuote = trimmed.match(/\/rwa\/quote\/([a-f0-9]+)/)
    if (matchQuote) return matchQuote[1]
    return trimmed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = extractToken(input)
    if (!token) {
      setError("Please paste your invite link or token.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/leads/token/${token}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "Invalid or expired invite link.")
        return
      }

      const status = json.lead?.status
      if (status === "QUOTE_SENT") {
        router.push(`/rwa/quote/${token}`)
      } else {
        router.push(`/rwa/setup/${token}`)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-oc-inset flex items-center justify-center px-4 overflow-hidden">
      {/* Full-screen hero background with depth fade */}
      <OmniMascot variant="hero" asBackground bgOpacity={12} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-oc-inset/70 to-oc-inset pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-oc-inset/60 to-oc-inset pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="relative mx-auto size-14 rounded-full overflow-hidden bg-oc-deep ring-2 ring-cyan-500/20 oc-shadow">
            <OmniMascot variant="avatar" size="sm" className="absolute inset-0 w-full h-full object-cover rounded-none ring-0" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-oc-fg tracking-[-0.02em]">Welcome to OmniCore</h1>
            <p className="text-sm text-oc-fg-dim mt-1">
              RWA Admin Portal — powered by CultSport
            </p>
          </div>
        </div>

        {/* Token gate card */}
        <div className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-5 oc-shadow-lg backdrop-blur-sm bg-oc-void/90">
          <div>
            <h2 className="text-sm font-medium text-oc-fg-soft">Access your gym setup</h2>
            <p className="text-xs text-oc-fg-dim mt-1">
              Paste the invite link or token sent to you by the CultSport team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">
                Invite link or token
              </label>
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null) }}
                rows={3}
                className="w-full bg-oc-inset border border-oc-border rounded-lg px-3 py-2.5 text-sm text-oc-fg-soft placeholder:text-oc-placeholder focus:outline-none focus:border-[#f97316]/50 resize-none font-mono"
                placeholder={"https://omnicore.app/rwa/setup/abc123...\nor just the token"}
              />
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary w-full"
            >
              {loading ? "Verifying…" : "Continue →"}
            </button>
          </form>

          <div className="border-t border-oc-border pt-4">
            <p className="text-xs text-oc-placeholder text-center">
              Don&apos;t have an invite?{" "}
              <span className="text-oc-fg-dim">
                Contact your CultSport relationship manager.
              </span>
            </p>
          </div>
        </div>

        {/* Steps preview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: "1", label: "Enter details", desc: "Gym info & modules" },
            { step: "2", label: "Review quote", desc: "Pricing from CultSport" },
            { step: "3", label: "Go live", desc: "Your gym is activated" },
          ].map((item) => (
            <div key={item.step} className="bg-oc-void/80 backdrop-blur-sm rounded-lg border border-oc-border p-3 text-center space-y-1 oc-shadow">
              <div className="w-6 h-6 rounded-full bg-oc-border text-oc-fg-dim text-xs flex items-center justify-center mx-auto font-medium">
                {item.step}
              </div>
              <p className="text-xs font-medium text-oc-fg-soft">{item.label}</p>
              <p className="text-[10px] text-oc-placeholder">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
