"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { copyToClipboard } from "@/lib/utils/clipboard"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateLeadSchema, type CreateLeadInput } from "@/lib/validations/lead"

export function CreateLeadForm() {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadSchema),
  })

  const onSubmit = async (data: CreateLeadInput) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to create lead")
      const link = `${window.location.origin}/rwa/setup/${json.inviteToken}`
      setInviteLink(link)
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (inviteLink) {
    return (
      <div className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <span className="text-emerald-400 text-sm">✓</span>
          </div>
          <h2 className="text-sm font-medium text-oc-fg-soft">Invite link generated</h2>
        </div>
        <p className="text-xs text-oc-fg-dim">Share this link with the RWA Admin. It expires in 7 days.</p>
        <div className="bg-oc-inset rounded-lg p-3 flex items-center gap-3">
          <span className="text-xs text-oc-fg-soft font-mono flex-1 break-all">{inviteLink}</span>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyToClipboard(inviteLink)
              if (ok) {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }
            }}
            className="text-xs text-[#f97316] hover:text-[#ea6c0c] whitespace-nowrap"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          onClick={() => setInviteLink(null)}
          className="text-xs text-oc-fg-dim hover:text-oc-fg-soft"
        >
          Create another →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Society Name *</label>
        <input
          {...register("societyName")}
          className="form-input"
          placeholder="e.g. Godrej Emerald"
        />
        {errors.societyName && <p className="text-xs text-red-400">{errors.societyName.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">RWA Admin Name *</label>
        <input
          {...register("contactName")}
          className="form-input"
          placeholder="e.g. Rohit Sharma"
        />
        {errors.contactName && <p className="text-xs text-red-400">{errors.contactName.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">RWA Admin Email *</label>
        <input
          {...register("contactEmail")}
          type="email"
          className="form-input"
          placeholder="e.g. rohit@society.in"
        />
        {errors.contactEmail && <p className="text-xs text-red-400">{errors.contactEmail.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-oc-fg-muted uppercase tracking-wider">Phone (optional)</label>
        <input
          {...register("contactPhone")}
          className="form-input"
          placeholder="e.g. 9876543210"
        />
        {errors.contactPhone && <p className="text-xs text-red-400">{errors.contactPhone.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? "Generating invite…" : "Generate Invite Link"}
      </button>
    </form>
  )
}
