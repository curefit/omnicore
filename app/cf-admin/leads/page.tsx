import { prisma } from "@/lib/db/client"
import { LeadPipelineTable } from "@/components/leads/LeadPipelineTable"
import { SectionHeader } from "@/components/shared/SectionHeader"
import Link from "next/link"

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { quote: { select: { status: true } } },
  })

  return (
    <div className="p-8 space-y-6">
      <SectionHeader
        title="Lead Pipeline"
        description={`${leads.length} leads total`}
        action={
          <Link href="/cf-admin/leads/new" className="btn-primary">
            + Invite Society
          </Link>
        }
      />
      <LeadPipelineTable leads={leads} />
    </div>
  )
}
