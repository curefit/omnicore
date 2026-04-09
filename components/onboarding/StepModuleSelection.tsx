"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ModuleSelector } from "./ModuleSelector"
import { type CenterModuleKey } from "@/lib/constants/enums"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepModuleSelection({ data, onChange, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<CenterModuleKey[]>(data.selectedModules)
  const [error, setError] = useState<string | null>(null)

  function handleChange(modules: CenterModuleKey[]) {
    setSelected(modules)
    setError(null)
  }

  function handleNext() {
    if (selected.length === 0) {
      setError("Select at least one module to continue.")
      return
    }
    onChange({ selectedModules: selected })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">
          What services will this center provide?
        </h2>
        <p className="text-sm text-[#9ca3af]">
          Select the modules you want to enable. This determines which setup
          steps follow and which features are available for this center.
        </p>
      </div>

      <ModuleSelector selected={selected} onChange={handleChange} />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {selected.length > 0 && (
        <div className="rounded-lg border border-[#1f2937] bg-[#111827] p-3">
          <p className="text-xs text-[#6b7280] mb-2">Setup steps that will appear:</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((key) => (
              <span
                key={key}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              >
                {key.charAt(0) + key.slice(1).toLowerCase().replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}

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
