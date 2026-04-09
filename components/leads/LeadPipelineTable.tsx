"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"

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
      <div className="text-center py-16 text-[#6b7280]">
        No leads yet. Invite a society to get started.
      </div>
    )
  }

  return (
    <div className="bg-[#111111] rounded-xl border border-[#1f2937] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1f2937]">
            <th className="text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider px-6 py-3">Society</th>
            <th className="text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider px-6 py-3">Contact</th>
            <th className="text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider px-6 py-3">Status</th>
            <th className="text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider px-6 py-3">Quote</th>
            <th className="text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider px-6 py-3">Created</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f2937]">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-[#1a1a1a] transition-colors">
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-[#e5e7eb]">{lead.societyName}</span>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm text-[#e5e7eb]">{lead.contactName}</p>
                  <p className="text-xs text-[#6b7280]">{lead.contactEmail}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-6 py-4">
                {lead.quote ? (
                  <StatusBadge status={lead.quote.status} />
                ) : (
                  <span className="text-xs text-[#6b7280]">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-[#6b7280]">
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
