import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ModuleSelector } from "@/components/onboarding/ModuleSelector"
import { CENTER_MODULE_META, CenterModuleKey } from "@/lib/constants/enums"

// ─── ModuleSelector ───────────────────────────────────────────────────────────

describe("ModuleSelector", () => {
  it("renders all 5 modules", () => {
    render(<ModuleSelector selected={[]} onChange={vi.fn()} />)
    CENTER_MODULE_META.forEach((m) => {
      expect(screen.getByText(m.label)).toBeInTheDocument()
    })
  })

  it("shows descriptions for each module", () => {
    render(<ModuleSelector selected={[]} onChange={vi.fn()} />)
    expect(screen.getByText(/trainer management/i)).toBeInTheDocument()
    expect(screen.getByText(/gym equipment/i)).toBeInTheDocument()
  })

  it("calls onChange when a module is toggled on", () => {
    const onChange = vi.fn()
    render(<ModuleSelector selected={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText("Trainers"))
    expect(onChange).toHaveBeenCalledWith([CenterModuleKey.TRAINERS])
  })

  it("calls onChange when a module is toggled off", () => {
    const onChange = vi.fn()
    render(
      <ModuleSelector
        selected={[CenterModuleKey.TRAINERS]}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText("Trainers"))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("shows selected modules as visually active", () => {
    render(
      <ModuleSelector
        selected={[CenterModuleKey.TRAINERS, CenterModuleKey.ASSETS]}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByTestId("module-TRAINERS")).toHaveAttribute(
      "data-selected",
      "true"
    )
    expect(screen.getByTestId("module-ASSETS")).toHaveAttribute(
      "data-selected",
      "true"
    )
    expect(screen.getByTestId("module-MYGATE")).toHaveAttribute(
      "data-selected",
      "false"
    )
  })
})

// ─── Onboarding step derivation ───────────────────────────────────────────────

import { deriveOnboardingSteps } from "@/lib/onboarding/steps"

describe("deriveOnboardingSteps", () => {
  it("always includes Gym Details as step 0", () => {
    const steps = deriveOnboardingSteps([])
    expect(steps[0].id).toBe("gym-details")
  })

  it("always includes Module Selection as step 1", () => {
    const steps = deriveOnboardingSteps([])
    expect(steps[1].id).toBe("modules")
  })

  it("always includes Review as the last step", () => {
    const steps = deriveOnboardingSteps([])
    expect(steps[steps.length - 1].id).toBe("review")
  })

  it("adds trainer-setup step when TRAINERS module is selected", () => {
    const steps = deriveOnboardingSteps([CenterModuleKey.TRAINERS])
    expect(steps.some((s) => s.id === "trainer-setup")).toBe(true)
  })

  it("adds asset-setup step when ASSETS module is selected", () => {
    const steps = deriveOnboardingSteps([CenterModuleKey.ASSETS])
    expect(steps.some((s) => s.id === "asset-setup")).toBe(true)
  })

  it("adds mygate-config step when MYGATE module is selected", () => {
    const steps = deriveOnboardingSteps([CenterModuleKey.MYGATE])
    expect(steps.some((s) => s.id === "mygate-config")).toBe(true)
  })

  it("does NOT add trainer-setup when TRAINERS not selected", () => {
    const steps = deriveOnboardingSteps([CenterModuleKey.ASSETS])
    expect(steps.some((s) => s.id === "trainer-setup")).toBe(false)
  })

  it("returns minimum 3 steps when no modules selected", () => {
    const steps = deriveOnboardingSteps([])
    expect(steps.length).toBeGreaterThanOrEqual(3)
  })

  it("returns correct count for all modules selected", () => {
    const steps = deriveOnboardingSteps([
      CenterModuleKey.TRAINERS,
      CenterModuleKey.ASSETS,
      CenterModuleKey.MYGATE,
      CenterModuleKey.VENDING_MACHINES,
      CenterModuleKey.BRANDING,
    ])
    // gym-details + modules + trainer + assets + mygate + vending + branding + review = 8
    expect(steps.length).toBe(8)
  })
})
