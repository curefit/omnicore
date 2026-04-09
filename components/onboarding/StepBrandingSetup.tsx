"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FormField } from "./FormField"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronLeft, ChevronRight, Palette } from "lucide-react"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepBrandingSetup({ data, onChange, onNext, onBack }: Props) {
  const [displayName, setDisplayName] = useState(data.displayName ?? data.name)

  function handleNext() {
    onChange({ displayName })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Palette className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Branding</h2>
        </div>
        <p className="text-sm text-[#9ca3af] mt-1">
          Configure the public-facing display name for this center.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Display Name"
          hint="Shown to members and in public communications"
          className="sm:col-span-2"
        >
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={data.name}
            className="form-input"
          />
        </FormField>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
