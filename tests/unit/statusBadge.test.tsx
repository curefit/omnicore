import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatusBadge } from "@/components/shared/StatusBadge"

describe("StatusBadge", () => {
  describe("asset condition statuses", () => {
    it("renders GOOD status with correct label", () => {
      render(<StatusBadge status="GOOD" />)
      expect(screen.getByText("Good")).toBeInTheDocument()
    })
    it("renders FAIR status with correct label", () => {
      render(<StatusBadge status="FAIR" />)
      expect(screen.getByText("Fair")).toBeInTheDocument()
    })
    it("renders POOR status with correct label", () => {
      render(<StatusBadge status="POOR" />)
      expect(screen.getByText("Poor")).toBeInTheDocument()
    })
  })

  describe("service request statuses", () => {
    it("renders OPEN status", () => {
      render(<StatusBadge status="OPEN" />)
      expect(screen.getByText("Open")).toBeInTheDocument()
    })
    it("renders ASSIGNED status", () => {
      render(<StatusBadge status="ASSIGNED" />)
      expect(screen.getByText("Assigned")).toBeInTheDocument()
    })
    it("renders IN_PROGRESS status", () => {
      render(<StatusBadge status="IN_PROGRESS" />)
      expect(screen.getByText("In Progress")).toBeInTheDocument()
    })
    it("renders RESOLVED status", () => {
      render(<StatusBadge status="RESOLVED" />)
      expect(screen.getByText("Resolved")).toBeInTheDocument()
    })
  })

  describe("attendance statuses", () => {
    it("renders PRESENT status", () => {
      render(<StatusBadge status="PRESENT" />)
      expect(screen.getByText("Present")).toBeInTheDocument()
    })
    it("renders ABSENT status", () => {
      render(<StatusBadge status="ABSENT" />)
      expect(screen.getByText("Absent")).toBeInTheDocument()
    })
    it("renders LATE status", () => {
      render(<StatusBadge status="LATE" />)
      expect(screen.getByText("Late")).toBeInTheDocument()
    })
  })

  describe("center statuses", () => {
    it("renders ACTIVE status", () => {
      render(<StatusBadge status="ACTIVE" />)
      expect(screen.getByText("Active")).toBeInTheDocument()
    })
    it("renders ONBOARDING status", () => {
      render(<StatusBadge status="ONBOARDING" />)
      expect(screen.getByText("Onboarding")).toBeInTheDocument()
    })
    it("renders INACTIVE status", () => {
      render(<StatusBadge status="INACTIVE" />)
      expect(screen.getByText("Inactive")).toBeInTheDocument()
    })
  })

  describe("trainer type", () => {
    it("renders FULLTIME type", () => {
      render(<StatusBadge status="FULLTIME" />)
      expect(screen.getByText("Full-time")).toBeInTheDocument()
    })
    it("renders PT type", () => {
      render(<StatusBadge status="PT" />)
      expect(screen.getByText("PT")).toBeInTheDocument()
    })
  })

  it("renders unknown status as the raw value", () => {
    render(<StatusBadge status="UNKNOWN_VALUE" />)
    expect(screen.getByText("UNKNOWN_VALUE")).toBeInTheDocument()
  })
})
