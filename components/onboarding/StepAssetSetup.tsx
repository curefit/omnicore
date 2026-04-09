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
        <h2 className="text-base font-semibold text-white mb-1">Asset Setup</h2>
        <p className="text-sm text-[#9ca3af]">
          Equipment inventory for this center will be managed in the Assets section after onboarding.
          You can bulk-import or add assets individually once the center is active.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1f2937] border border-[#374151] mx-auto mb-4">
          <Wrench className="w-5 h-5 text-[#6b7280]" />
        </div>
        <p className="text-sm font-medium text-[#f9fafb] mb-1">Assets Added Post-Onboarding</p>
        <p className="text-xs text-[#6b7280] max-w-xs mx-auto">
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
