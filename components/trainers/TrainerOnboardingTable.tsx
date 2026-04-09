import Link from "next/link"
import {
  TRAINER_ONBOARDING_STAGES,
  TRAINER_ONBOARDING_STAGE_LABELS,
  TRAINER_ONBOARDING_STAGE_DESCRIPTIONS,
  type TrainerOnboardingStage,
} from "@/lib/trainers/onboardingStages"
import { languagesToDisplay } from "@/lib/trainers/languages"

export type TrainerOnboardingRow = {
  id: string
  pipelineStage: string
  name: string
  phone: string
  email: string | null
  employeeRef: string | null
  areaLocality: string | null
  languagesKnown: string | null
  tentativeStartDate: Date | null
  joinedOn: Date | null
  updatedAt: Date
}

function fmt(d: Date | null | undefined) {
  if (!d) return "—"
  const x = d instanceof Date ? d : new Date(d)
  return Number.isNaN(x.getTime()) ? "—" : x.toLocaleDateString()
}

function groupByStage(rows: TrainerOnboardingRow[]) {
  const map = new Map<TrainerOnboardingStage, TrainerOnboardingRow[]>()
  for (const s of TRAINER_ONBOARDING_STAGES) {
    map.set(s, [])
  }
  for (const row of rows) {
    const stage = (TRAINER_ONBOARDING_STAGES as readonly string[]).includes(row.pipelineStage)
      ? (row.pipelineStage as TrainerOnboardingStage)
      : "HIRING"
    map.get(stage)!.push(row)
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }
  return map
}

export function TrainerOnboardingTable({ onboardings }: { onboardings: TrainerOnboardingRow[] }) {
  const grouped = groupByStage(onboardings)

  if (onboardings.length === 0) {
    return (
      <div className="rounded-xl border border-oc-border bg-oc-card/50 px-6 py-10 text-center text-sm text-oc-fg-dim">
        No candidates in the hiring pipeline yet.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {TRAINER_ONBOARDING_STAGES.map((stage) => {
        const rows = grouped.get(stage) ?? []
        const title = TRAINER_ONBOARDING_STAGE_LABELS[stage]
        const blurb = TRAINER_ONBOARDING_STAGE_DESCRIPTIONS[stage]
        return (
          <section key={stage} className="rounded-xl border border-oc-border overflow-hidden bg-oc-deep/40">
            <div className="px-4 py-3 border-b border-oc-border bg-oc-card/80">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-oc-fg-soft tracking-tight">{title}</h2>
                <span className="text-[11px] text-oc-fg-dim tabular-nums">{rows.length} candidate{rows.length === 1 ? "" : "s"}</span>
              </div>
              <p className="text-[11px] text-oc-fg-dim mt-1.5 leading-relaxed max-w-4xl">{blurb}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="border-b border-oc-border bg-oc-deep text-left text-[11px] font-semibold uppercase tracking-wider text-oc-fg-dim">
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Ref</th>
                    <th className="px-4 py-2.5">Phone</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Area</th>
                    <th className="px-4 py-2.5">Languages</th>
                    <th className="px-4 py-2.5">Tentative start</th>
                    <th className="px-4 py-2.5">Joined on</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-xs text-oc-placeholder">
                        No one in this stage.
                      </td>
                    </tr>
                  ) : (
                    rows.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-oc-border/80 hover:bg-oc-row/60 transition-colors"
                      >
                        <td className="px-4 py-3 align-top font-medium">
                          <Link
                            href={`/cf-admin/trainers/${o.id}`}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            {o.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top text-oc-fg-muted tabular-nums">{o.employeeRef ?? "—"}</td>
                        <td className="px-4 py-3 align-top text-oc-fg-muted tabular-nums whitespace-nowrap">{o.phone}</td>
                        <td className="px-4 py-3 align-top text-oc-fg-muted max-w-[200px] truncate" title={o.email ?? ""}>
                          {o.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-oc-fg-muted max-w-[140px] truncate" title={o.areaLocality ?? ""}>
                          {o.areaLocality ?? "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-oc-fg-dim max-w-[180px] truncate" title={languagesToDisplay(o.languagesKnown)}>
                          {languagesToDisplay(o.languagesKnown) || "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-oc-fg-muted tabular-nums whitespace-nowrap">
                          {fmt(o.tentativeStartDate)}
                        </td>
                        <td className="px-4 py-3 align-top text-oc-fg-muted tabular-nums whitespace-nowrap">
                          {fmt(o.joinedOn)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
