import { CenterModuleKey, type CenterModuleKey as ModuleKey } from "@/lib/constants/enums"
import { type StepperStep } from "@/components/shared/Stepper"
import { type GymSetupType } from "@/lib/equipment/catalog"

export type { GymSetupType }

export interface OnboardingStep extends StepperStep {
  id: string
  label: string
  description?: string
  moduleKey?: ModuleKey
}

// Fixed steps — always present
const FIXED_START: OnboardingStep[] = [
  {
    id: "gym-details",
    label: "Gym Details",
    description: "Center info, society name, sq ft, capacity",
  },
  {
    id: "modules",
    label: "Select Modules",
    description: "Choose which capabilities to enable",
  },
]

const FIXED_END: OnboardingStep[] = [
  {
    id: "review",
    label: "Review & Confirm",
    description: "Review all details before saving",
  },
]

// Conditional steps — appear only when the corresponding module is selected
const CONDITIONAL_STEPS_BASE: Record<ModuleKey, OnboardingStep> = {
  [CenterModuleKey.TRAINERS]: {
    id: "trainer-setup",
    label: "Trainer Setup",
    description: "Map initial trainers to this center",
    moduleKey: CenterModuleKey.TRAINERS,
  },
  [CenterModuleKey.ASSETS]: {
    id: "asset-setup",
    label: "Asset Setup",
    description: "Tag initial equipment inventory",
    moduleKey: CenterModuleKey.ASSETS,
  },
  [CenterModuleKey.MYGATE]: {
    id: "mygate-config",
    label: "MyGate Config",
    description: "Connect MyGate for footfall & attendance",
    moduleKey: CenterModuleKey.MYGATE,
  },
  [CenterModuleKey.VENDING_MACHINES]: {
    id: "vending-setup",
    label: "Vending Machines",
    description: "Register vending machine locations",
    moduleKey: CenterModuleKey.VENDING_MACHINES,
    isOptional: true,
  },
  [CenterModuleKey.BRANDING]: {
    id: "branding-setup",
    label: "Branding",
    description: "Configure center display name and visuals",
    moduleKey: CenterModuleKey.BRANDING,
    isOptional: true,
  },
}

// Equipment-specific override steps based on gymSetupType
const ASSET_STEP_NEW_GYM: OnboardingStep = {
  id: "equipment-selection",
  label: "Equipment Setup",
  description: "Recommended equipment for your new gym",
  moduleKey: CenterModuleKey.ASSETS,
}

const ASSET_STEP_EXISTING_GYM: OnboardingStep = {
  id: "services-needed",
  label: "Services Needed",
  description: "Select equipment upgrades for your existing gym",
  moduleKey: CenterModuleKey.ASSETS,
}

// Order in which conditional steps appear in the flow
const CONDITIONAL_ORDER: ModuleKey[] = [
  CenterModuleKey.TRAINERS,
  CenterModuleKey.ASSETS,
  CenterModuleKey.MYGATE,
  CenterModuleKey.VENDING_MACHINES,
  CenterModuleKey.BRANDING,
]

export function deriveOnboardingSteps(
  selectedModules: ModuleKey[],
  gymSetupType?: GymSetupType
): OnboardingStep[] {
  const conditionalSteps = CONDITIONAL_ORDER
    .filter((key) => selectedModules.includes(key))
    .map((key) => {
      // Replace the ASSETS step based on gymSetupType
      if (key === CenterModuleKey.ASSETS && gymSetupType === "NEW_GYM") {
        return ASSET_STEP_NEW_GYM
      }
      if (key === CenterModuleKey.ASSETS && gymSetupType === "EXISTING_GYM") {
        return ASSET_STEP_EXISTING_GYM
      }
      return CONDITIONAL_STEPS_BASE[key]
    })

  return [...FIXED_START, ...conditionalSteps, ...FIXED_END]
}
