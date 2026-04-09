"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { OmniMascot } from "@/components/shared/OmniMascot"

interface Lead {
  id: string
  societyName: string
  contactName: string
  contactEmail: string
  status: string
  createdAt: Date
  quote: { status: string } | null
}

interface Props {
  leads: Lead[]
}

export function LeadPipelineTable({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-center">
        <OmniMascot variant="empty" size="lg" />
        <p className="text-sm font-medium text-oc-fg-muted">No leads yet</p>
        <p className="text-xs text-oc-fg-dim">Invite a society to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-oc-void rounded-xl border border-oc-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-oc-border">
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Society</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Contact</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Status</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Quote</th>
            <th className="text-left text-xs font-medium text-oc-fg-dim uppercase tracking-wider px-6 py-3">Created</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-oc-border">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-oc-void-alt transition-colors">
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-oc-fg-soft">{lead.societyName}</span>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm text-oc-fg-soft">{lead.contactName}</p>
                  <p className="text-xs text-oc-fg-dim">{lead.contactEmail}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-6 py-4">
                {lead.quote ? (
                  <StatusBadge status={lead.quote.status} />
                ) : (
                  <span className="text-xs text-oc-fg-dim">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-oc-fg-dim">
                {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/cf-admin/leads/${lead.id}`}
                  className="text-xs text-[#f97316] hover:text-[#ea6c0c] font-medium"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
