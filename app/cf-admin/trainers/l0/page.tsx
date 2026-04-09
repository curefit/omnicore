import Link from "next/link"
import { prisma } from "@/lib/db/client"
import { TrainerL0Table } from "@/components/trainers/TrainerL0Table"

export default async function TrainerL0Page() {
  const enrollments = await prisma.trainerL0Training.findMany({
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">L0 training</h1>
          <p className="text-sm text-oc-fg-dim mt-1 max-w-3xl">
            Post-offer program with explicit <strong className="text-oc-fg-muted">start</strong> and{" "}
            <strong className="text-oc-fg-muted">end</strong> dates. Separate from hiring and from live center
            assignments.
          </p>
        </div>
        <Link
          href="/cf-admin/trainers/l0/new"
          className="px-4 py-2 bg-amber-500/90 text-oc-base text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors shrink-0"
        >
          + Add enrollment
        </Link>
      </div>

      <TrainerL0Table enrollments={enrollments} />
    </div>
  )
}
