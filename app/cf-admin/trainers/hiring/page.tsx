import Link from "next/link"
import { prisma } from "@/lib/db/client"
import { TrainerOnboardingTable } from "@/components/trainers/TrainerOnboardingTable"

export default async function TrainerHiringPipelinePage() {
  const onboardings = await prisma.trainerOnboarding.findMany({
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">Hiring pipeline</h1>
          <p className="text-sm text-oc-fg-dim mt-1 max-w-3xl">
            <strong className="text-oc-fg-muted">Hiring</strong> is sourcing and early screening before structured
            interviews. Stages end at <strong className="text-oc-fg-muted">offer accepted</strong> (tentative / join
            dates below). L0 and center assignment live in other tabs.
          </p>
        </div>
        <Link
          href="/cf-admin/trainers/hiring/new"
          className="btn-primary shrink-0"
        >
          + Add candidate
        </Link>
      </div>

      <TrainerOnboardingTable onboardings={onboardings} />
    </div>
  )
}
