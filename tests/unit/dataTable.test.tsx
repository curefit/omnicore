import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DataTable } from "@/components/shared/DataTable"

const columns = [
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
  { key: "city", header: "City" },
]

const rows = [
  { id: "1", name: "Prestige Lakeside", status: "ACTIVE", city: "Bengaluru" },
  { id: "2", name: "Brigade Orchards", status: "ACTIVE", city: "Bengaluru" },
  { id: "3", name: "Sobha Dream Acres", status: "ONBOARDING", city: "Bengaluru" },
]

describe("DataTable", () => {
  it("renders column headers", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("City")).toBeInTheDocument()
  })

  it("renders all rows", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByText("Prestige Lakeside")).toBeInTheDocument()
    expect(screen.getByText("Brigade Orchards")).toBeInTheDocument()
    expect(screen.getByText("Sobha Dream Acres")).toBeInTheDocument()
  })

  it("renders empty state when data is empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyMessage="No centers found"
      />
    )
    expect(screen.getByText("No centers found")).toBeInTheDocument()
  })

  it("renders default empty message when none provided", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByText("No data")).toBeInTheDocument()
  })

  it("supports custom cell render function", () => {
    const columnsWithRender = [
      { key: "name", header: "Name" },
      {
        key: "status",
        header: "Status",
        render: (row: (typeof rows)[0]) => (
          <span data-testid="custom-cell">{row.status}-custom</span>
        ),
      },
    ]
    render(
      <DataTable
        columns={columnsWithRender}
        data={[rows[0]]}
        keyExtractor={(r) => r.id}
      />
    )
    expect(screen.getByTestId("custom-cell")).toHaveTextContent("ACTIVE-custom")
  })
})
