import { prisma } from "@/lib/db/client"
import { LeadPipelineTable } from "@/components/leads/LeadPipelineTable"
import Link from "next/link"

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { quote: { select: { status: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#e5e7eb]">Lead Pipeline</h1>
          <p className="text-sm text-[#6b7280] mt-1">{leads.length} leads total</p>
        </div>
        <Link
          href="/cf-admin/leads/new"
          className="px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-[#ea6c0c] transition-colors"
        >
          + Invite Society
        </Link>
      </div>
      <LeadPipelineTable leads={leads} />
    </div>
  )
}
