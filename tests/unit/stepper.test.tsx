import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Stepper } from "@/components/shared/Stepper"

const steps = [
  { id: "gym-details", label: "Gym Details" },
  { id: "modules", label: "Select Modules" },
  { id: "trainer-setup", label: "Trainer Setup" },
  { id: "review", label: "Review & Confirm" },
]

describe("Stepper", () => {
  it("renders all step labels", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />)
    expect(screen.getByText("Gym Details")).toBeInTheDocument()
    expect(screen.getByText("Select Modules")).toBeInTheDocument()
    expect(screen.getByText("Trainer Setup")).toBeInTheDocument()
    expect(screen.getByText("Review & Confirm")).toBeInTheDocument()
  })

  it("marks the current step as active", () => {
    render(<Stepper steps={steps} currentStep={1} completedSteps={[0]} />)
    const activeStep = screen.getByTestId("step-1-active")
    expect(activeStep).toBeInTheDocument()
  })

  it("marks completed steps correctly", () => {
    render(<Stepper steps={steps} currentStep={2} completedSteps={[0, 1]} />)
    expect(screen.getByTestId("step-0-complete")).toBeInTheDocument()
    expect(screen.getByTestId("step-1-complete")).toBeInTheDocument()
  })

  it("renders step numbers for pending steps", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />)
    // Steps 1, 2, 3 (index 1, 2, 3) should show their step numbers
    expect(screen.getByTestId("step-1-pending")).toBeInTheDocument()
    expect(screen.getByTestId("step-2-pending")).toBeInTheDocument()
    expect(screen.getByTestId("step-3-pending")).toBeInTheDocument()
  })

  it("renders correct step count", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />)
    // 4 step indicators
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
  })
})
