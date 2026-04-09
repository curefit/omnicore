import Link from "next/link"
import { TrainerOnboardingForm } from "@/components/trainers/TrainerOnboardingForm"

export default function NewTrainerOnboardingPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cf-admin/trainers/hiring" className="text-oc-fg-dim hover:text-oc-fg-soft text-sm">
          ← Back to hiring pipeline
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">New trainer candidate</h1>
        <p className="text-sm text-oc-fg-dim mt-1">
          Capture profile details for the hiring process (stops at offer accepted).
        </p>
      </div>
      <TrainerOnboardingForm />
    </div>
  )
}
