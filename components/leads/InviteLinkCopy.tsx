"use client"

import { useState } from "react"
import { copyToClipboard } from "@/lib/utils/clipboard"

export function InviteLinkCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-2">
      <p className="text-xs text-oc-fg-dim">Invite Link</p>
      <div className="flex items-start gap-3 bg-oc-inset rounded-lg border border-oc-border p-3">
        <span className="text-xs text-oc-fg-soft font-mono break-all flex-1 min-w-0">{url}</span>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyToClipboard(url)
            if (ok) {
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }
          }}
          className="text-xs font-medium text-[#f97316] hover:text-[#ea6c0c] whitespace-nowrap shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
