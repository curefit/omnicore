import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepperStep {
  id: string
  label: string
  description?: string
  isOptional?: boolean
}

interface StepperProps {
  steps: StepperStep[]
  currentStep: number
  completedSteps: number[]
  className?: string
}

export function Stepper({ steps, currentStep, completedSteps, className }: StepperProps) {
  return (
    <nav className={cn("w-full", className)} aria-label="Onboarding progress">
      <ol className="flex items-center w-full" role="list">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.includes(idx)
          const isActive = idx === currentStep
          const isPending = !isCompleted && !isActive
          const isLast = idx === steps.length - 1

          return (
            <li
              key={step.id}
              className={cn("flex items-center", !isLast && "flex-1")}
              role="listitem"
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Step indicator */}
                <div
                  data-testid={
                    isCompleted
                      ? `step-${idx}-complete`
                      : isActive
                      ? `step-${idx}-active`
                      : `step-${idx}-pending`
                  }
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all",
                    isCompleted &&
                      "bg-cyan-500 border-cyan-500 text-[#0a0d14]",
                    isActive &&
                      "bg-[#1e3a4a] border-cyan-500 text-cyan-400 shadow-[0_0_0_3px_rgba(6,182,212,0.15)]",
                    isPending &&
                      "bg-[#111827] border-[#374151] text-[#6b7280]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-[11px] font-semibold whitespace-nowrap",
                      isCompleted && "text-cyan-400",
                      isActive && "text-white",
                      isPending && "text-[#6b7280]"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.isOptional && (
                    <p className="text-[10px] text-[#6b7280]">Optional</p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2 mt-[-18px]",
                    isCompleted ? "bg-cyan-500/40" : "bg-[#1f2937]"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
