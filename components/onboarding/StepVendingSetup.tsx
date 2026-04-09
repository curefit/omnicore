"use client"

import { Button } from "@/components/ui/button"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepVendingSetup({ data, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Vending Machines</h2>
        </div>
        <p className="text-sm text-[#9ca3af] mt-1">
          Vending machine setup and management will be available post-onboarding
          in the center detail view.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-8 text-center">
        <p className="text-xs text-[#6b7280]">
          Coming in a future update — machine IDs, locations, and restocking schedules.
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
