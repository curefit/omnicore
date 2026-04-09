// TDD: written before implementation.
// These tests define the contract for lib/equipment/catalog.ts and the updated steps.ts

import { describe, it, expect } from "vitest"
import {
  EQUIPMENT_CATALOG,
  getCatalogByCategory,
  getModelGymItems,
  CATEGORY_DISPLAY_NAMES,
  MODEL_GYM_SETUPS,
  type GymSetupType,
} from "@/lib/equipment/catalog"
import { deriveOnboardingSteps } from "@/lib/onboarding/steps"
import { CenterModuleKey } from "@/lib/constants/enums"

// ── Catalog integrity ─────────────────────────────────────────────────────────

describe("EQUIPMENT_CATALOG", () => {
  it("contains at least 30 items", () => {
    expect(EQUIPMENT_CATALOG.length).toBeGreaterThanOrEqual(30)
  })

  it("every item has sku, name, and category", () => {
    for (const item of EQUIPMENT_CATALOG) {
      expect(item.sku, `${item.name} missing sku`).toBeTruthy()
      expect(item.name, `${item.sku} missing name`).toBeTruthy()
      expect(item.category, `${item.sku} missing category`).toBeTruthy()
    }
  })

  it("all skus are unique", () => {
    const skus = EQUIPMENT_CATALOG.map((i) => i.sku)
    expect(new Set(skus).size).toBe(skus.length)
  })

  it("covers at least 10 distinct categories", () => {
    const cats = new Set(EQUIPMENT_CATALOG.map((i) => i.category))
    expect(cats.size).toBeGreaterThanOrEqual(10)
  })

  it("includes Cultsport treadmill SKUs from catalog", () => {
    const skus = EQUIPMENT_CATALOG.map((i) => i.sku)
    expect(skus).toContain("CS-AC800")
    expect(skus).toContain("CS-V6")
  })

  it("includes strength machine from Flow series", () => {
    const flowItems = EQUIPMENT_CATALOG.filter((i) => i.series === "FLOW")
    expect(flowItems.length).toBeGreaterThanOrEqual(4)
  })
})

// ── getCatalogByCategory ──────────────────────────────────────────────────────

describe("getCatalogByCategory", () => {
  it("returns only items for the requested category", () => {
    const items = getCatalogByCategory("TREADMILL")
    expect(items.every((i) => i.category === "TREADMILL")).toBe(true)
  })

  it("returns empty array for unknown category", () => {
    expect(getCatalogByCategory("NONEXISTENT_CATEGORY")).toEqual([])
  })

  it("returns at least 3 treadmill items", () => {
    expect(getCatalogByCategory("TREADMILL").length).toBeGreaterThanOrEqual(3)
  })
})

// ── Model gym setups ──────────────────────────────────────────────────────────

describe("MODEL_GYM_SETUPS", () => {
  it("has entries for SMALL, MEDIUM, and LARGE", () => {
    expect(MODEL_GYM_SETUPS.SMALL).toBeDefined()
    expect(MODEL_GYM_SETUPS.MEDIUM).toBeDefined()
    expect(MODEL_GYM_SETUPS.LARGE).toBeDefined()
  })

  it("SMALL has 5+ items", () => {
    expect(MODEL_GYM_SETUPS.SMALL.length).toBeGreaterThanOrEqual(5)
  })

  it("MEDIUM has 10+ items", () => {
    expect(MODEL_GYM_SETUPS.MEDIUM.length).toBeGreaterThanOrEqual(10)
  })

  it("LARGE has 18+ items", () => {
    expect(MODEL_GYM_SETUPS.LARGE.length).toBeGreaterThanOrEqual(18)
  })

  it("every model gym item references a valid catalog SKU", () => {
    const catalogSkus = new Set(EQUIPMENT_CATALOG.map((i) => i.sku))
    for (const tier of ["SMALL", "MEDIUM", "LARGE"] as const) {
      for (const item of MODEL_GYM_SETUPS[tier]) {
        expect(catalogSkus.has(item.sku), `${tier}: SKU ${item.sku} not in catalog`).toBe(true)
      }
    }
  })

  it("every model gym item has a positive quantity", () => {
    for (const tier of ["SMALL", "MEDIUM", "LARGE"] as const) {
      for (const item of MODEL_GYM_SETUPS[tier]) {
        expect(item.qty, `${tier}: ${item.sku} qty must be > 0`).toBeGreaterThan(0)
      }
    }
  })

  it("LARGE is a superset of MEDIUM in terms of categories covered", () => {
    const mediumCats = new Set(
      MODEL_GYM_SETUPS.MEDIUM.map((i) => {
        const cat = EQUIPMENT_CATALOG.find((c) => c.sku === i.sku)?.category
        return cat
      }).filter(Boolean)
    )
    const largeCats = new Set(
      MODEL_GYM_SETUPS.LARGE.map((i) => {
        const cat = EQUIPMENT_CATALOG.find((c) => c.sku === i.sku)?.category
        return cat
      }).filter(Boolean)
    )
    for (const cat of mediumCats) {
      expect(largeCats.has(cat), `LARGE missing category ${cat} that MEDIUM has`).toBe(true)
    }
  })
})

// ── getModelGymItems ──────────────────────────────────────────────────────────

describe("getModelGymItems", () => {
  it("returns catalog items with qty for a given tier", () => {
    const items = getModelGymItems("SMALL")
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.sku).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.qty).toBeGreaterThan(0)
    }
  })
})

// ── CATEGORY_DISPLAY_NAMES ────────────────────────────────────────────────────

describe("CATEGORY_DISPLAY_NAMES", () => {
  it("has display name for TREADMILL", () => {
    expect(CATEGORY_DISPLAY_NAMES.TREADMILL).toBeTruthy()
  })
  it("has display name for STRENGTH_FLOW", () => {
    expect(CATEGORY_DISPLAY_NAMES.STRENGTH_FLOW).toBeTruthy()
  })
  it("has display name for ACCESSORIES", () => {
    expect(CATEGORY_DISPLAY_NAMES.ACCESSORIES).toBeTruthy()
  })
})

// ── deriveOnboardingSteps with gymSetupType ───────────────────────────────────

describe("deriveOnboardingSteps with gymSetupType", () => {
  it("inserts equipment-selection for NEW_GYM + ASSETS module", () => {
    const steps = deriveOnboardingSteps(
      [CenterModuleKey.ASSETS],
      "NEW_GYM" as GymSetupType
    )
    const ids = steps.map((s) => s.id)
    expect(ids).toContain("equipment-selection")
    expect(ids).not.toContain("services-needed")
  })

  it("inserts services-needed for EXISTING_GYM + ASSETS module", () => {
    const steps = deriveOnboardingSteps(
      [CenterModuleKey.ASSETS],
      "EXISTING_GYM" as GymSetupType
    )
    const ids = steps.map((s) => s.id)
    expect(ids).toContain("services-needed")
    expect(ids).not.toContain("equipment-selection")
  })

  it("omits equipment steps when ASSETS module not selected", () => {
    const steps = deriveOnboardingSteps([CenterModuleKey.TRAINERS], "NEW_GYM" as GymSetupType)
    const ids = steps.map((s) => s.id)
    expect(ids).not.toContain("equipment-selection")
    expect(ids).not.toContain("services-needed")
  })

  it("falls back to original behavior when gymSetupType is undefined", () => {
    const withType = deriveOnboardingSteps([], undefined)
    const withoutType = deriveOnboardingSteps([])
    expect(withType.map((s) => s.id)).toEqual(withoutType.map((s) => s.id))
  })

  it("always has gym-details as first step and review as last", () => {
    for (const gymType of ["NEW_GYM", "EXISTING_GYM", undefined] as const) {
      const steps = deriveOnboardingSteps([CenterModuleKey.ASSETS, CenterModuleKey.TRAINERS], gymType)
      expect(steps[0].id).toBe("gym-details")
      expect(steps[steps.length - 1].id).toBe("review")
    }
  })
})
