import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Sidebar } from "@/components/shared/Sidebar"

describe("Sidebar", () => {
  describe("CF Admin role", () => {
    it("renders the OmniCore brand name", () => {
      render(<Sidebar role="cf-admin" currentPath="/cf-admin" />)
      expect(screen.getByText("OmniCore")).toBeInTheDocument()
    })

    it("renders all CF Admin nav items", () => {
      render(<Sidebar role="cf-admin" currentPath="/cf-admin" />)
      expect(screen.getByText("Overview")).toBeInTheDocument()
      expect(screen.getByText("Leads")).toBeInTheDocument()
      expect(screen.getByText("Onboarding")).toBeInTheDocument()
      expect(screen.getByText("Pricing")).toBeInTheDocument()
      expect(screen.getByText("Trainers")).toBeInTheDocument()
      expect(screen.getByText("Assets")).toBeInTheDocument()
      expect(screen.getByText("Service Requests")).toBeInTheDocument()
      expect(screen.queryByText("Payroll")).not.toBeInTheDocument()
      expect(screen.queryByText("Settings")).not.toBeInTheDocument()
    })

    it("does not show READ ONLY badge for CF Admin", () => {
      render(<Sidebar role="cf-admin" currentPath="/cf-admin" />)
      expect(screen.queryByText("READ ONLY")).not.toBeInTheDocument()
    })

    it("role switcher links to /rwa-admin", () => {
      render(<Sidebar role="cf-admin" currentPath="/cf-admin" />)
      const switcherLink = screen.getByTestId("role-switcher-link")
      expect(switcherLink).toHaveAttribute("href", "/rwa-admin")
    })

    it("displays CF Admin role label", () => {
      render(<Sidebar role="cf-admin" currentPath="/cf-admin" />)
      expect(screen.getByText("CF Admin")).toBeInTheDocument()
    })
  })

  describe("RWA Admin role", () => {
    it("renders all RWA Admin nav items", () => {
      render(<Sidebar role="rwa-admin" currentPath="/rwa-admin" />)
      expect(screen.getByText("Dashboard")).toBeInTheDocument()
      expect(screen.getByText("Trainer Attendance")).toBeInTheDocument()
      expect(screen.getByText("Assets")).toBeInTheDocument()
      expect(screen.getByText("Service Requests")).toBeInTheDocument()
    })

    it("shows READ ONLY badge for RWA Admin", () => {
      render(<Sidebar role="rwa-admin" currentPath="/rwa-admin" />)
      expect(screen.getByText("READ ONLY")).toBeInTheDocument()
    })

    it("does not render Payroll link for RWA Admin", () => {
      render(<Sidebar role="rwa-admin" currentPath="/rwa-admin" />)
      expect(screen.queryByText("Payroll")).not.toBeInTheDocument()
    })

    it("does not render Onboarding link for RWA Admin", () => {
      render(<Sidebar role="rwa-admin" currentPath="/rwa-admin" />)
      expect(screen.queryByText("Onboarding")).not.toBeInTheDocument()
    })

    it("role switcher links to /cf-admin", () => {
      render(<Sidebar role="rwa-admin" currentPath="/rwa-admin" />)
      const switcherLink = screen.getByTestId("role-switcher-link")
      expect(switcherLink).toHaveAttribute("href", "/cf-admin")
    })

    it("displays RWA Admin role label", () => {
      render(<Sidebar role="rwa-admin" currentPath="/rwa-admin" />)
      expect(screen.getByText("RWA Admin")).toBeInTheDocument()
    })
  })
})
