import { CreateLeadForm } from "@/components/leads/CreateLeadForm"

export default function NewLeadPage() {
  return (
    <div className="p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-[-0.02em] text-oc-fg-soft">Invite a Society</h1>
        <p className="text-sm text-oc-fg-dim mt-1">
          Send an invite link to the RWA Admin to complete the setup wizard.
        </p>
      </div>
      <CreateLeadForm />
    </div>
  )
}
