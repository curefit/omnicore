"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center mx-auto">
            <span className="text-[#f97316] text-xl font-bold">O</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#e5e7eb]">Welcome to OmniCore</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              RWA Admin Portal — powered by CultSport
            </p>
          </div>
        </div>

        {/* Token gate card */}
        <div className="bg-[#111111] rounded-xl border border-[#1f2937] p-6 space-y-5">
          <div>
            <h2 className="text-sm font-medium text-[#e5e7eb]">Access your gym setup</h2>
            <p className="text-xs text-[#6b7280] mt-1">
              Paste the invite link or token sent to you by the CultSport team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                Invite link or token
              </label>
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null) }}
                rows={3}
                className="w-full bg-[#0a0a0a] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-[#e5e7eb] placeholder:text-[#4b5563] focus:outline-none focus:border-[#f97316]/50 resize-none font-mono"
                placeholder={"https://omnicore.app/rwa/setup/abc123...\nor just the token"}
              />
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-2.5 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying…" : "Continue →"}
            </button>
          </form>

          <div className="border-t border-[#1f2937] pt-4">
            <p className="text-xs text-[#4b5563] text-center">
              Don't have an invite?{" "}
              <span className="text-[#6b7280]">
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
            <div key={item.step} className="bg-[#111111] rounded-lg border border-[#1f2937] p-3 text-center space-y-1">
              <div className="w-6 h-6 rounded-full bg-[#1f2937] text-[#6b7280] text-xs flex items-center justify-center mx-auto font-medium">
                {item.step}
              </div>
              <p className="text-xs font-medium text-[#e5e7eb]">{item.label}</p>
              <p className="text-[10px] text-[#4b5563]">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
