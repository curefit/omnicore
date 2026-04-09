import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Activity } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Active Centers" value="3" icon={Activity} />)
    expect(screen.getByText("Active Centers")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("renders numeric values", () => {
    render(<StatCard label="Total Members" value={1284} icon={Activity} />)
    expect(screen.getByText("1284")).toBeInTheDocument()
  })

  it("renders a description when provided", () => {
    render(
      <StatCard
        label="Open Requests"
        value="5"
        icon={Activity}
        description="2 critical"
      />
    )
    expect(screen.getByText("2 critical")).toBeInTheDocument()
  })

  it("renders trend when provided", () => {
    render(
      <StatCard
        label="Footfall"
        value="42"
        icon={Activity}
        trend={{ value: 12, label: "vs yesterday" }}
      />
    )
    expect(screen.getByText("vs yesterday")).toBeInTheDocument()
  })

  it("renders without optional props", () => {
    render(<StatCard label="Trainers" value="—" icon={Activity} />)
    expect(screen.getByText("Trainers")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})
