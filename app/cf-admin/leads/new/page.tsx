import { CreateLeadForm } from "@/components/leads/CreateLeadForm"

export default function NewLeadPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#e5e7eb]">Invite a Society</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Send an invite link to the RWA Admin to complete the setup wizard.
        </p>
      </div>
      <CreateLeadForm />
    </div>
  )
}
