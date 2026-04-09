"use client"

import { Button } from "@/components/ui/button"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepAssetSetup({ data, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-oc-fg mb-1">Asset Setup</h2>
        <p className="text-sm text-oc-fg-muted">
          Equipment inventory for this center will be managed in the Assets section after onboarding.
          You can bulk-import or add assets individually once the center is active.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-oc-border bg-oc-card/50 p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-oc-border border border-oc-muted mx-auto mb-4">
          <Wrench className="w-5 h-5 text-oc-fg-dim" />
        </div>
        <p className="text-sm font-medium text-oc-fg mb-1">Assets Added Post-Onboarding</p>
        <p className="text-xs text-oc-fg-dim max-w-xs mx-auto">
          After this center goes live, use CF Admin → Assets to tag equipment,
          set service schedules, and track condition.
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
