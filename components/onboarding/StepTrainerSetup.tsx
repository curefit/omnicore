"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { type OnboardingData } from "./OnboardingShell"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  availableTrainers: { id: string; name: string; trainerType: string }[]
}

export function StepTrainerSetup({ data, onChange, onNext, onBack, availableTrainers }: Props) {
  const [selected, setSelected] = useState<string[]>(data.trainerIds ?? [])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  function handleNext() {
    onChange({ trainerIds: selected })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Map Trainers</h2>
        <p className="text-sm text-[#9ca3af]">
          Select trainers to assign to this center. You can add more later.
        </p>
      </div>

      <div className="space-y-2">
        {availableTrainers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1f2937] p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              No trainers in the system yet. Add trainers first from the Trainers section.
            </p>
          </div>
        ) : (
          availableTrainers.map((trainer) => {
            const isSelected = selected.includes(trainer.id)
            return (
              <button
                key={trainer.id}
                type="button"
                onClick={() => toggle(trainer.id)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                  isSelected
                    ? "border-cyan-500/40 bg-cyan-500/5"
                    : "border-[#1f2937] bg-[#111827] hover:border-[#374151] hover:bg-[#1a2235]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-[#374151] bg-[#1f2937]"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-[#0a0d14]" strokeWidth={2.5} />}
                  </div>
                  <span className="text-sm font-medium text-[#f9fafb]">{trainer.name}</span>
                </div>
                <StatusBadge status={trainer.trainerType} />
              </button>
            )
          })
        )}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-[#9ca3af]">
          {selected.length} trainer{selected.length > 1 ? "s" : ""} selected
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          {selected.length === 0 ? "Skip for now" : "Continue"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
