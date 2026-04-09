import { InviteLinkCopy } from "@/components/leads/InviteLinkCopy"

interface Lead {
  id: string
  societyName: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  status: string
  inviteToken: string
  inviteExpiresAt: Date
  formData: string | null
}

interface FormData {
  name?: string
  code?: string
  address?: string
  city?: string
  gymSqFt?: number
  totalUnits?: number
  selectedModules?: string[]
  capacity?: number
  rwaName?: string
  contactPersonName?: string
  contactPersonPhone?: string
}

interface Props {
  lead: Lead
  formData: FormData | null
}

export function LeadReviewPanel({ lead, formData }: Props) {
  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/rwa/setup/${lead.inviteToken}`

  return (
    <div className="bg-oc-void rounded-xl border border-oc-border p-6 space-y-4">
      <h2 className="text-sm font-medium text-oc-fg-soft">Lead Details</h2>

      <div className="space-y-3">
        <Row label="Contact" value={`${lead.contactName} — ${lead.contactEmail}`} />
        {lead.contactPhone && <Row label="Phone" value={lead.contactPhone} />}
        <Row label="Invite Expires" value={new Date(lead.inviteExpiresAt).toLocaleDateString("en-IN")} />
      </div>

      {formData && (
        <>
          <hr className="border-oc-border" />
          <h2 className="text-sm font-medium text-oc-fg-soft">Submitted Info</h2>
          <div className="space-y-3">
            {formData.name && <Row label="Gym Name" value={formData.name} />}
            {formData.code && <Row label="Code" value={formData.code} />}
            {formData.address && <Row label="Address" value={`${formData.address}, ${formData.city}`} />}
            {formData.gymSqFt && <Row label="Gym Size" value={`${formData.gymSqFt} sq ft`} />}
            {formData.capacity && <Row label="Capacity" value={`${formData.capacity} members`} />}
            {formData.totalUnits && <Row label="Total Units" value={`${formData.totalUnits} households`} />}
            {formData.rwaName && <Row label="RWA" value={formData.rwaName} />}
            {formData.contactPersonName && (
              <Row label="RWA Contact" value={`${formData.contactPersonName} — ${formData.contactPersonPhone}`} />
            )}
            {formData.selectedModules && (
              <div>
                <span className="text-xs text-oc-fg-dim">Requested Modules</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.selectedModules.map((m) => (
                    <span key={m} className="text-xs bg-oc-border text-oc-fg-muted px-2 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {lead.status === "INVITED" && (
        <>
          <hr className="border-oc-border" />
          <InviteLinkCopy url={inviteLink} />
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-oc-fg-dim">{label}</span>
      <span className="text-xs text-oc-fg-soft text-right">{value}</span>
    </div>
  )
}
