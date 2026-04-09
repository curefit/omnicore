import { prisma } from "@/lib/db/client"

export default async function TrainersMappedPage() {
  const mappings = await prisma.centerTrainerMapping.findMany({
    where: { isActive: true },
    orderBy: [{ center: { name: "asc" } }, { trainer: { name: "asc" } }],
    include: {
      center: { select: { id: true, name: true, code: true, city: true } },
      trainer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          trainerType: true,
          specialization: true,
        },
      },
    },
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">Assigned to centers</h1>
        <p className="text-sm text-oc-fg-dim mt-1">
          Active <code className="text-oc-fg-dim">CenterTrainerMapping</code> rows — who works where. Distinct from
          hiring, L0, or “posted” placeholders; this is the operational roster link only.
        </p>
      </div>

      {mappings.length === 0 ? (
        <div className="rounded-xl border border-oc-border bg-oc-card/50 px-6 py-10 text-center text-sm text-oc-fg-dim">
          No center–trainer mappings yet.
        </div>
      ) : (
        <div className="rounded-xl border border-oc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-oc-border bg-oc-deep text-left text-[11px] font-semibold uppercase tracking-wider text-oc-fg-dim">
                <th className="px-4 py-3">Center</th>
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} className="border-b border-oc-border/80 hover:bg-oc-row/60">
                  <td className="px-4 py-3">
                    <span className="font-medium text-oc-fg-soft">{m.center.name}</span>
                    <span className="text-oc-fg-dim ml-2">({m.center.code})</span>
                    <p className="text-[11px] text-oc-fg-dim mt-0.5">{m.center.city}</p>
                  </td>
                  <td className="px-4 py-3 text-oc-fg-soft">{m.trainer.name}</td>
                  <td className="px-4 py-3 text-oc-fg-muted">{m.trainer.trainerType}</td>
                  <td className="px-4 py-3 text-oc-fg-muted tabular-nums">{m.trainer.phone}</td>
                  <td className="px-4 py-3 text-oc-fg-dim tabular-nums">
                    {m.assignedOn.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
