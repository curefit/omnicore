"use client"

import { useState } from "react"
import { Link2 } from "lucide-react"
import { copyToClipboard } from "@/lib/utils/clipboard"

type QuoteStatus = "SENT" | "REVISION_REQUESTED"

export function RwaQuoteLinkCard({
  url,
  quoteStatus,
  showBaseUrlHint,
}: {
  url: string
  quoteStatus: QuoteStatus
  /** True when NEXT_PUBLIC_BASE_URL is unset — link is path-only */
  showBaseUrlHint?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isRevision = quoteStatus === "REVISION_REQUESTED"

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
        <h2 className="text-sm font-semibold text-oc-fg-soft">RWA quote link</h2>
      </div>
      <p className="text-xs text-oc-fg-dim leading-relaxed">
        {isRevision
          ? "RWA requested changes — they can return here to view the quote while CultSport revises."
          : "Share with the society / RWA admin to review, negotiate, or accept on the public portal (same invite token as setup)."}
      </p>
      {showBaseUrlHint && (
        <p className="text-[11px] text-amber-400/90">
          Set <span className="font-mono">NEXT_PUBLIC_BASE_URL</span> in production so this is a full URL you can paste into email or chat.
        </p>
      )}
      <div className="flex items-start gap-3 bg-oc-inset rounded-lg border border-oc-border p-3">
        <span className="text-xs text-oc-fg-soft font-mono break-all flex-1 min-w-0">{url}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-[#f97316] hover:text-[#ea6c0c] whitespace-nowrap shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
