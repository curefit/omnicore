"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Stepper } from "@/components/shared/Stepper"
import { Button } from "@/components/ui/button"
import { deriveOnboardingSteps } from "@/lib/onboarding/steps"
import { type CenterModuleKey } from "@/lib/constants/enums"
import { getModelGymItems, computeGymTier, type GymSetupType } from "@/lib/equipment/catalog"
import { StepGymDetails } from "./StepGymDetails"
import { StepModuleSelection } from "./StepModuleSelection"
import { StepTrainerSetup } from "./StepTrainerSetup"
import { StepAssetSetup } from "./StepAssetSetup"
import { StepEquipmentSelection, type SelectedEquipmentItem } from "./StepEquipmentSelection"
import { StepServicesNeeded } from "./StepServicesNeeded"
import { StepMyGateConfig } from "./StepMyGateConfig"
import { StepVendingSetup } from "./StepVendingSetup"
import { StepBrandingSetup } from "./StepBrandingSetup"
import { StepReview } from "./StepReview"

export interface OnboardingData {
  // Step 1
  gymSetupType: GymSetupType
  name: string
  code: string
  address: string
  city: string
  pincode: string
  capacity: number
  gymSqFt?: number
  rwaName: string
  totalUnits: number
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  // Step 2
  selectedModules: CenterModuleKey[]
  // Step 3a
  trainerIds?: string[]
  // Step 3b — assets added during onboarding (simplified legacy)
  assetCount?: number
  selectedEquipment: SelectedEquipmentItem[]
  // Step 3e
  myGateSocietyId?: string
  myGateApiKey?: string
  myGateWebhookUrl?: string
  // Step branding
  displayName?: string
}

const EMPTY_DATA: OnboardingData = {
  gymSetupType: "NEW_GYM",
  name: "",
  code: "",
  address: "",
  city: "",
  pincode: "",
  capacity: 0,
  rwaName: "",
  totalUnits: 0,
  contactPersonName: "",
  contactPersonPhone: "",
  contactPersonEmail: "",
  selectedModules: [],
  selectedEquipment: [],
}

interface OnboardingShellProps {
  availableTrainers: { id: string; name: string; trainerType: string }[]
}

export function OnboardingShell({ availableTrainers }: OnboardingShellProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = deriveOnboardingSteps(data.selectedModules, data.gymSetupType)
  const currentStepDef = steps[currentStep]
  const equipmentPrefillDoneRef = useRef(false)

  useEffect(() => {
    if (currentStepDef?.id !== "equipment-selection") {
      equipmentPrefillDoneRef.current = false
      return
    }
    if (data.gymSetupType !== "NEW_GYM") return
    if ((data.selectedEquipment?.length ?? 0) > 0) return
    if (equipmentPrefillDoneRef.current) return
    equipmentPrefillDoneRef.current = true
    const tier = computeGymTier(data.gymSqFt, data.totalUnits)
    const modelItems = getModelGymItems(tier)
    setData((prev) => ({
      ...prev,
      selectedEquipment: modelItems.map((i) => ({ ...i, qty: i.qty })),
    }))
  }, [
    currentStepDef?.id,
    data.gymSetupType,
    data.gymSqFt,
    data.totalUnits,
    data.selectedEquipment.length,
  ])
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  function updateData(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }))
  }

  function goNext() {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep])
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    setError(null)
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    setError(null)
  }

  async function handleSubmit() {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to save center")
      }
      const { centerId } = await res.json()
      router.push(`/cf-admin/onboarding?onboarded=${centerId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  function renderStep() {
    switch (currentStepDef.id) {
      case "gym-details":
        return <StepGymDetails data={data} onChange={updateData} onNext={goNext} />
      case "modules":
        return (
          <StepModuleSelection
            data={data}
            onChange={updateData}
            onNext={goNext}
            onBack={goBack}
          />
        )
      case "trainer-setup":
        return (
          <StepTrainerSetup
            data={data}
            onChange={updateData}
            onNext={goNext}
            onBack={goBack}
            availableTrainers={availableTrainers}
          />
        )
      case "asset-setup":
        return (
          <StepAssetSetup data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
        )
      case "equipment-selection":
        return (
          <StepEquipmentSelection
            gymSqFt={data.gymSqFt}
            totalUnits={data.totalUnits}
            selectedEquipment={data.selectedEquipment}
            onChange={(items) => updateData({ selectedEquipment: items })}
            onNext={goNext}
            onBack={goBack}
          />
        )
      case "services-needed":
        return (
          <StepServicesNeeded
            selectedEquipment={data.selectedEquipment}
            onChange={(items) => updateData({ selectedEquipment: items })}
            onNext={goNext}
            onBack={goBack}
          />
        )
      case "mygate-config":
        return (
          <StepMyGateConfig data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
        )
      case "vending-setup":
        return (
          <StepVendingSetup data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
        )
      case "branding-setup":
        return (
          <StepBrandingSetup data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
        )
      case "review":
        return (
          <StepReview
            data={data}
            steps={steps}
            onBack={goBack}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            error={error}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-oc-base">
      {/* Header */}
      <div className="border-b border-oc-border bg-oc-deep px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-lg font-bold text-oc-fg">
                New Center Onboarding
              </h1>
              <p className="text-xs text-oc-fg-dim mt-0.5">
                Step {currentStep + 1} of {steps.length} —{" "}
                <span className="text-oc-fg-muted">{currentStepDef.label}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/cf-admin/onboarding")}
            >
              Cancel
            </Button>
          </div>

          <Stepper
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {renderStep()}
      </div>
    </div>
  )
}
