import Link from "next/link"
import { TrainerL0Form } from "@/components/trainers/TrainerL0Form"

export default function NewTrainerL0Page() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cf-admin/trainers/l0" className="text-oc-fg-dim hover:text-oc-fg-soft text-sm">
          ← Back to L0 training
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">New L0 enrollment</h1>
        <p className="text-sm text-oc-fg-dim mt-1">
          Add someone who has accepted an offer and is entering L0 (not the same as hiring or roster).
        </p>
      </div>
      <TrainerL0Form />
    </div>
  )
}
