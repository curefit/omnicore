import { SectionHeader } from "@/components/shared/SectionHeader"
import { TrainerAttendanceCard } from "@/components/dashboard/TrainerAttendanceCard"
import { getCenterForRwaSession } from "@/lib/rwa/session"

export default async function RWAAdminAttendancePage() {
  const { center } = await getCenterForRwaSession()

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <SectionHeader
        title="Trainer attendance"
        description={
          center
            ? `${center.name} · check-ins for the local calendar day (today).`
            : "Check-ins and attendance for trainers at your facility."
        }
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide">
            READ ONLY
          </span>
        }
      />

      {center ? (
        <TrainerAttendanceCard centerId={center.id} />
      ) : (
        <div className="rounded-xl border border-dashed border-oc-border bg-oc-card/50 px-6 py-12 text-center">
          <p className="text-sm text-oc-fg-muted">No center is linked to your account yet.</p>
          <p className="text-xs text-oc-fg-dim mt-2 max-w-md mx-auto">
            After your quote is accepted, trainer attendance for your society gym will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
