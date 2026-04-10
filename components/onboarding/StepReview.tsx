"use client"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { type OnboardingData } from "./OnboardingShell"
import { type OnboardingStep } from "@/lib/onboarding/steps"
import { ChevronLeft, Save, Loader2, Building2, Users, Wifi, MapPin, Wrench } from "lucide-react"
import { CENTER_MODULE_META } from "@/lib/constants/enums"

interface Props {
  data: OnboardingData
  steps: OnboardingStep[]
  onBack: () => void
  onSubmit: () => void
  isSaving: boolean
  error: string | null
}

function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start justify-between py-2 border-b border-oc-border last:border-0">
      <span className="text-xs text-oc-fg-dim min-w-32">{label}</span>
      <span className="text-xs text-oc-fg text-right">{value}</span>
    </div>
  )
}

export function StepReview({ data, steps, onBack, onSubmit, isSaving, error }: Props) {
  const enabledModules = CENTER_MODULE_META.filter((m) =>
    data.selectedModules.includes(m.key)
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-oc-fg mb-1">Review & Confirm</h2>
        <p className="text-sm text-oc-fg-muted">
          Confirm the details below. The center will be saved in{" "}
          <StatusBadge status="ONBOARDING" size="sm" /> status and can be
          completed later.
        </p>
      </div>

      {/* Center details */}
      <div className="rounded-xl border border-oc-border bg-oc-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-oc-border bg-oc-deep">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-oc-fg-muted uppercase tracking-wider">
            Center Details
          </span>
        </div>
        <div className="px-4 py-2">
          <ReviewRow label="Name" value={data.name} />
          <ReviewRow label="Code" value={data.code} />
          <ReviewRow label="Address" value={`${data.address}, ${data.city} — ${data.pincode}`} />
          <ReviewRow label="Capacity" value={data.capacity} />
          <ReviewRow label="Gym Size" value={data.gymSqFt ? `${data.gymSqFt} sq ft` : null} />
          <ReviewRow
            label="Gym setup"
            value={data.gymSetupType === "NEW_GYM" ? "New gym (full catalog)" : "Existing gym (upgrades)"}
          />
        </div>
      </div>

      {/* Society details */}
      <div className="rounded-xl border border-oc-border bg-oc-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-oc-border bg-oc-deep">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-oc-fg-muted uppercase tracking-wider">
            Society / RWA
          </span>
        </div>
        <div className="px-4 py-2">
          <ReviewRow label="RWA Name" value={data.rwaName} />
          <ReviewRow label="Total Units" value={data.totalUnits} />
          <ReviewRow label="Contact" value={data.contactPersonName} />
          <ReviewRow label="Phone" value={data.contactPersonPhone} />
          <ReviewRow label="Email" value={data.contactPersonEmail} />
        </div>
      </div>

      {/* Modules */}
      <div className="rounded-xl border border-oc-border bg-oc-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-oc-border bg-oc-deep">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-oc-fg-muted uppercase tracking-wider">
            Enabled Modules ({enabledModules.length})
          </span>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {enabledModules.map((m) => (
            <span
              key={m.key}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            >
              {m.label}
            </span>
          ))}
          {enabledModules.length === 0 && (
            <span className="text-xs text-oc-fg-dim">No modules selected</span>
          )}
        </div>
      </div>

      {/* Selected equipment (ASSETS) */}
      {data.selectedModules.includes("ASSETS") && data.selectedEquipment.length > 0 && (
        <div className="rounded-xl border border-oc-border bg-oc-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-oc-border bg-oc-deep">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-oc-fg-muted uppercase tracking-wider">
              Equipment ({data.selectedEquipment.length} lines)
            </span>
          </div>
          <div className="px-4 py-3 max-h-48 overflow-y-auto space-y-1">
            {data.selectedEquipment.map((item) => (
              <div
                key={item.sku}
                className="flex justify-between text-xs text-oc-fg-muted gap-2"
              >
                <span className="text-oc-fg truncate">{item.name}</span>
                <span className="shrink-0 tabular-nums">×{item.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MyGate config summary */}
      {data.selectedModules.includes("MYGATE") && data.myGateSocietyId && (
        <div className="rounded-xl border border-oc-border bg-oc-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-oc-border bg-oc-deep">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-oc-fg-muted uppercase tracking-wider">
              MyGate Config
            </span>
          </div>
          <div className="px-4 py-2">
            <ReviewRow label="Society ID" value={data.myGateSocietyId} />
            <ReviewRow label="Webhook URL" value={data.myGateWebhookUrl || "Not set"} />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack} disabled={isSaving}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Center
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
