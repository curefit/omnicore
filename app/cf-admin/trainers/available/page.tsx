import { prisma } from "@/lib/db/client"

export default async function TrainersAvailablePage() {
  const trainers = await prisma.trainer.findMany({
    where: {
      isActive: true,
      centerMappings: { none: { isActive: true } },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      trainerType: true,
      specialization: true,
      joinedOn: true,
    },
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">Available to map</h1>
        <p className="text-sm text-oc-fg-dim mt-1">
          <code className="text-oc-fg-dim">Trainer</code> roster records with{" "}
          <span className="text-oc-fg-muted">no active center mapping</span>. Not the same as hiring candidates or
          L0 enrollments — add roster staff first, then assign in center onboarding or ops.
        </p>
      </div>

      {trainers.length === 0 ? (
        <div className="rounded-xl border border-oc-border bg-oc-card/50 px-6 py-10 text-center text-sm text-oc-fg-dim">
          No trainers on the bench. Everyone is mapped to at least one center, or add roster records in your admin
          tools.
        </div>
      ) : (
        <div className="rounded-xl border border-oc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-oc-border bg-oc-deep text-left text-[11px] font-semibold uppercase tracking-wider text-oc-fg-dim">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Focus</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id} className="border-b border-oc-border/80 hover:bg-oc-row/60">
                  <td className="px-4 py-3 font-medium text-oc-fg-soft">{t.name}</td>
                  <td className="px-4 py-3 text-oc-fg-muted">{t.trainerType}</td>
                  <td className="px-4 py-3 text-oc-fg-muted tabular-nums">{t.phone}</td>
                  <td className="px-4 py-3 text-oc-fg-muted">{t.email ?? "—"}</td>
                  <td className="px-4 py-3 text-oc-fg-dim">{t.specialization ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
