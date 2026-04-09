# Lead Funnel + Pricing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 3 — a two-sided lead funnel where CF Admin invites RWA Admin via magic link, RWA Admin completes the onboarding wizard, CF Admin builds and sends a quote, RWA Admin accepts, and a Center is auto-created.

**Architecture:** Four new Prisma models (Lead, Quote, QuoteLineItem, ServicePricingConfig, EquipmentRecommendation) back a token-gated RWA Admin setup wizard and a CF Admin lead pipeline. Pure business logic functions (equipment categorization, quote totals, token helpers) are fully unit-tested first. API routes enforce a state machine (INVITED → FORM_SUBMITTED → QUOTE_SENT → ACCEPTED). UI pages consume the API. The existing `OnboardingShell` step components are reused inside a new `RWASetupShell` that posts to the lead endpoint instead of the onboarding endpoint.

**Tech Stack:** Next.js 16 App Router, Prisma 5 + SQLite, Zod v4 (`err.issues` not `err.errors`), react-hook-form + @hookform/resolvers/zod, Vitest + RTL, Tailwind CSS v4, Lucide icons

---

## File Map

### New files
```
prisma/schema.prisma                              ← add 5 new models
lib/constants/enums.ts                            ← add LeadStatus, QuoteStatus, PricingType, MODULE_PRICING_LABEL
lib/onboarding/equipment.ts                       ← deriveEquipmentCategory()
lib/leads/token.ts                                ← generateInviteToken(), isTokenExpired(), tokenExpiresAt()
lib/leads/quote.ts                                ← computeQuoteTotals(), formatPaise()
lib/validations/lead.ts                           ← CreateLeadSchema, LeadFormSubmitSchema
lib/validations/quote.ts                          ← QuoteLineItemSchema, CreateQuoteSchema
tests/unit/equipment.test.ts                      ← deriveEquipmentCategory unit tests
tests/unit/quoteTotals.test.ts                    ← computeQuoteTotals unit tests
tests/unit/token.test.ts                          ← isTokenExpired unit tests
app/api/leads/route.ts                            ← GET list, POST create
app/api/leads/[id]/route.ts                       ← GET single lead
app/api/leads/[id]/submit/route.ts                ← POST form submission (RWA Admin)
app/api/leads/[id]/quote/route.ts                 ← POST create/replace quote
app/api/leads/[id]/quote/send/route.ts            ← POST send quote
app/api/leads/[id]/quote/accept/route.ts          ← POST accept → create center
app/api/leads/[id]/quote/reject/route.ts          ← POST reject
app/api/leads/token/[token]/route.ts              ← GET validate invite token
app/api/pricing/route.ts                          ← GET all pricing configs
app/api/pricing/[moduleKey]/route.ts              ← PUT update a module's default pricing
app/cf-admin/leads/page.tsx                       ← Lead pipeline list (server)
app/cf-admin/leads/new/page.tsx                   ← Create lead form (server shell + client form)
app/cf-admin/leads/[id]/page.tsx                  ← Lead detail + equipment recommendation (server)
app/cf-admin/leads/[id]/quote/page.tsx            ← Quote builder (server shell + client form)
app/cf-admin/pricing/page.tsx                     ← Default rate card editor (server shell + client)
app/rwa-admin/setup/[token]/page.tsx              ← Token-gated setup wizard (server shell + client)
app/rwa-admin/quote/[token]/page.tsx              ← Quote review + accept/reject (server shell + client)
components/leads/LeadPipelineTable.tsx            ← sortable table, status chips, action buttons
components/leads/CreateLeadForm.tsx               ← react-hook-form form
components/leads/LeadReviewPanel.tsx              ← form data summary
components/leads/EquipmentRecommendationPanel.tsx ← collapsible equipment card
components/leads/QuoteBuilder.tsx                 ← per-module pricing inputs + send CTA
components/leads/QuoteLineItemRow.tsx             ← single row (renders correct inputs per pricingType)
components/leads/PricingConfigTable.tsx           ← editable rate card table
components/onboarding/RWASetupShell.tsx           ← wizard shell that posts to /api/leads/[id]/submit
components/quote/QuoteSummaryCard.tsx             ← RWA Admin's read-only quote view with totals
components/quote/QuoteAcceptButtons.tsx           ← accept / reject with confirmation
```

### Modified files
```
prisma/seed.ts                                    ← add ServicePricingConfig × 5, EquipmentRecommendation × 3, Lead × 3
lib/constants/enums.ts                            ← append new enums + maps
lib/constants/navigation.ts                       ← add Leads + Pricing to CF_ADMIN_NAV
components/shared/StatusBadge.tsx                 ← add Lead + Quote status entries to STATUS_CONFIG
components/onboarding/ModuleSelector.tsx          ← add payment type label display
```

---

## Task 1: Prisma schema — add new models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add 5 new models to the end of schema.prisma (after the last model)**

```prisma
model Lead {
  id              String   @id @default(cuid())
  societyName     String
  contactName     String
  contactEmail    String
  contactPhone    String?
  status          String   @default("INVITED")
  inviteToken     String   @unique
  inviteExpiresAt DateTime
  formData        String?
  centerId        String?  @unique
  center          Center?  @relation(fields: [centerId], references: [id])
  quote           Quote?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Quote {
  id         String          @id @default(cuid())
  leadId     String          @unique
  lead       Lead            @relation(fields: [leadId], references: [id])
  status     String          @default("DRAFT")
  notes      String?
  sentAt     DateTime?
  acceptedAt DateTime?
  lineItems  QuoteLineItem[]
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt
}

model QuoteLineItem {
  id          String @id @default(cuid())
  quoteId     String
  quote       Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  moduleKey   String
  pricingType String
  oneTimeFee  Int?
  monthlyFee  Int?
  takeRatePct Float?
}

model ServicePricingConfig {
  id                 String  @id @default(cuid())
  moduleKey          String  @unique
  pricingType        String
  defaultOneTimeFee  Int?
  defaultMonthlyFee  Int?
  defaultTakeRatePct Float?
}

model EquipmentRecommendation {
  id           String @id @default(cuid())
  sizeCategory String @unique
  items        String
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_lead_funnel_models
```

Expected: migration file created in `prisma/migrations/`, `prisma generate` runs automatically.

- [ ] **Step 3: Verify Prisma client picks up new models**

```bash
npx prisma studio
```

Expected: Lead, Quote, QuoteLineItem, ServicePricingConfig, EquipmentRecommendation tables visible.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Lead, Quote, ServicePricingConfig, EquipmentRecommendation to schema"
```

---

## Task 2: New enums and constants

**Files:**
- Modify: `lib/constants/enums.ts`
- Modify: `lib/constants/navigation.ts`

- [ ] **Step 1: Append new enums and maps to end of `lib/constants/enums.ts`**

```typescript
// ─── Lead funnel ──────────────────────────────────────────────────────────────

export const LeadStatus = {
  INVITED: "INVITED",
  FORM_SUBMITTED: "FORM_SUBMITTED",
  QUOTE_SENT: "QUOTE_SENT",
  ACCEPTED: "ACCEPTED",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
} as const
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus]

export const QuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]

export const PricingType = {
  MONTHLY: "MONTHLY",
  ONE_TIME: "ONE_TIME",
  ONE_TIME_PLUS_TAKE_RATE: "ONE_TIME_PLUS_TAKE_RATE",
} as const
export type PricingType = (typeof PricingType)[keyof typeof PricingType]

export const EquipmentSizeCategory = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
} as const
export type EquipmentSizeCategory =
  (typeof EquipmentSizeCategory)[keyof typeof EquipmentSizeCategory]

// Maps each module to its pricing type — used in QuoteBuilder and ModuleSelector
export const MODULE_PRICING_TYPE: Record<CenterModuleKey, PricingType> = {
  [CenterModuleKey.TRAINERS]: PricingType.MONTHLY,
  [CenterModuleKey.ASSETS]: PricingType.ONE_TIME,
  [CenterModuleKey.VENDING_MACHINES]: PricingType.ONE_TIME_PLUS_TAKE_RATE,
  [CenterModuleKey.MYGATE]: PricingType.MONTHLY,
  [CenterModuleKey.BRANDING]: PricingType.ONE_TIME,
}

// Human-readable label shown to RWA Admin on module cards (no amounts)
export const MODULE_PRICING_LABEL: Record<CenterModuleKey, string> = {
  [CenterModuleKey.TRAINERS]: "Monthly rate",
  [CenterModuleKey.ASSETS]: "One-time setup",
  [CenterModuleKey.VENDING_MACHINES]: "One-time installation + revenue share",
  [CenterModuleKey.MYGATE]: "Monthly rate",
  [CenterModuleKey.BRANDING]: "One-time setup",
}
```

- [ ] **Step 2: Add Leads and Pricing to `CF_ADMIN_NAV` in `lib/constants/navigation.ts`**

Replace the existing `CF_ADMIN_NAV` array with:

```typescript
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  Ticket,
  DollarSign,
  Settings,
  Activity,
  ClipboardList,
  Funnel,
  type LucideIcon,
} from "lucide-react"
```

> Note: `Funnel` may not exist in your version of lucide-react. If it doesn't, use `Filter` instead. Check with `import { Filter } from "lucide-react"`.

Replace `CF_ADMIN_NAV`:

```typescript
export const CF_ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/cf-admin", icon: LayoutDashboard },
  { label: "Leads", href: "/cf-admin/leads", icon: Filter },
  { label: "Onboarding", href: "/cf-admin/onboarding", icon: Building2 },
  { label: "Pricing", href: "/cf-admin/pricing", icon: DollarSign },
  { label: "Trainers", href: "/cf-admin/trainers", icon: Users },
  { label: "Assets", href: "/cf-admin/assets", icon: Wrench },
  { label: "Service Requests", href: "/cf-admin/service-requests", icon: Ticket },
  { label: "Payroll", href: "/cf-admin/payroll", icon: DollarSign },
  { label: "Settings", href: "/cf-admin/settings", icon: Settings },
]
```

> Remove the `Funnel` import if using `Filter`. The full import line for navigation.ts becomes:
> `import { LayoutDashboard, Building2, Users, Wrench, Ticket, DollarSign, Settings, Activity, ClipboardList, Filter, type LucideIcon } from "lucide-react"`

- [ ] **Step 3: Add Lead and Quote statuses to `STATUS_CONFIG` in `components/shared/StatusBadge.tsx`**

Insert after the `// Center status` section:

```typescript
  // Lead funnel status
  INVITED: {
    label: "Invited",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotClassName: "bg-blue-400",
  },
  FORM_SUBMITTED: {
    label: "Form Submitted",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dotClassName: "bg-cyan-400",
  },
  QUOTE_SENT: {
    label: "Quote Sent",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dotClassName: "bg-red-400",
  },
  // Quote status
  DRAFT: {
    label: "Draft",
    className: "bg-[#1f2937]/80 text-[#9ca3af] border-[#374151]",
    dotClassName: "bg-[#9ca3af]",
  },
  SENT: {
    label: "Sent",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClassName: "bg-amber-400",
  },
```

> Note: `ACTIVE` and `ACCEPTED` already exist in `STATUS_CONFIG` (mapped to emerald), which works for both Center and Lead ACTIVE/ACCEPTED states.

- [ ] **Step 4: Commit**

```bash
git add lib/constants/enums.ts lib/constants/navigation.ts components/shared/StatusBadge.tsx
git commit -m "feat: add LeadStatus, QuoteStatus, PricingType enums; update nav and StatusBadge"
```

---

## Task 3: Business logic — TDD

**Files:**
- Create: `lib/onboarding/equipment.ts`
- Create: `lib/leads/token.ts`
- Create: `lib/leads/quote.ts`
- Create: `tests/unit/equipment.test.ts`
- Create: `tests/unit/quoteTotals.test.ts`
- Create: `tests/unit/token.test.ts`

### 3a — Equipment category

- [ ] **Step 1: Write failing test at `tests/unit/equipment.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"

describe("deriveEquipmentCategory", () => {
  it("returns SMALL when both dimensions are below thresholds", () => {
    expect(deriveEquipmentCategory(500, 100)).toBe("SMALL")
  })

  it("returns SMALL at the exact lower boundary (999 sqft, 199 units)", () => {
    expect(deriveEquipmentCategory(999, 199)).toBe("SMALL")
  })

  it("returns MEDIUM when gymSqFt hits 1000", () => {
    expect(deriveEquipmentCategory(1000, 100)).toBe("MEDIUM")
  })

  it("returns MEDIUM when totalUnits hits 200 (even if sqft < 1000)", () => {
    expect(deriveEquipmentCategory(800, 200)).toBe("MEDIUM")
  })

  it("returns MEDIUM at the upper boundary (2500 sqft, 500 units)", () => {
    expect(deriveEquipmentCategory(2500, 500)).toBe("MEDIUM")
  })

  it("returns LARGE when gymSqFt exceeds 2500", () => {
    expect(deriveEquipmentCategory(2501, 100)).toBe("LARGE")
  })

  it("returns LARGE when totalUnits exceeds 500 (even if sqft is small)", () => {
    expect(deriveEquipmentCategory(500, 501)).toBe("LARGE")
  })

  it("returns LARGE when both dimensions are large", () => {
    expect(deriveEquipmentCategory(3000, 700)).toBe("LARGE")
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- tests/unit/equipment.test.ts
```

Expected: `Cannot find module '@/lib/onboarding/equipment'`

- [ ] **Step 3: Create `lib/onboarding/equipment.ts`**

```typescript
import { type EquipmentSizeCategory } from "@/lib/constants/enums"

export interface EquipmentItem {
  name: string
  quantity: number
}

/**
 * Categorize gym size for equipment recommendations.
 * LARGE wins if either dimension is large (max of both dimensions drives category).
 */
export function deriveEquipmentCategory(
  gymSqFt: number,
  totalUnits: number
): EquipmentSizeCategory {
  if (gymSqFt > 2500 || totalUnits > 500) return "LARGE"
  if (gymSqFt >= 1000 || totalUnits >= 200) return "MEDIUM"
  return "SMALL"
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npm test -- tests/unit/equipment.test.ts
```

Expected: 8 tests pass.

### 3b — Quote totals

- [ ] **Step 5: Write failing test at `tests/unit/quoteTotals.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import { computeQuoteTotals, formatPaise } from "@/lib/leads/quote"

describe("computeQuoteTotals", () => {
  it("sums one-time fees correctly", () => {
    const result = computeQuoteTotals([
      { oneTimeFee: 50000, monthlyFee: null },
      { oneTimeFee: 30000, monthlyFee: null },
    ])
    expect(result.totalOneTimePaise).toBe(80000)
    expect(result.totalMonthlyPaise).toBe(0)
  })

  it("sums monthly fees correctly", () => {
    const result = computeQuoteTotals([
      { oneTimeFee: null, monthlyFee: 10000 },
      { oneTimeFee: null, monthlyFee: 15000 },
    ])
    expect(result.totalOneTimePaise).toBe(0)
    expect(result.totalMonthlyPaise).toBe(25000)
  })

  it("sums mixed items correctly", () => {
    const result = computeQuoteTotals([
      { oneTimeFee: 200000, monthlyFee: null },
      { oneTimeFee: 50000, monthlyFee: 10000 },
      { oneTimeFee: null, monthlyFee: 20000 },
    ])
    expect(result.totalOneTimePaise).toBe(250000)
    expect(result.totalMonthlyPaise).toBe(30000)
  })

  it("returns zeros for empty list", () => {
    const result = computeQuoteTotals([])
    expect(result.totalOneTimePaise).toBe(0)
    expect(result.totalMonthlyPaise).toBe(0)
  })

  it("treats undefined fees as 0", () => {
    const result = computeQuoteTotals([{ oneTimeFee: undefined, monthlyFee: undefined }])
    expect(result.totalOneTimePaise).toBe(0)
    expect(result.totalMonthlyPaise).toBe(0)
  })
})

describe("formatPaise", () => {
  it("formats paise to rupees with Indian locale", () => {
    expect(formatPaise(100000)).toBe("₹1,000")
    expect(formatPaise(50000)).toBe("₹500")
    expect(formatPaise(0)).toBe("₹0")
  })
})
```

- [ ] **Step 6: Run test — confirm it fails**

```bash
npm test -- tests/unit/quoteTotals.test.ts
```

Expected: `Cannot find module '@/lib/leads/quote'`

- [ ] **Step 7: Create `lib/leads/quote.ts`**

```typescript
export interface QuoteLineItemTotalsInput {
  oneTimeFee?: number | null
  monthlyFee?: number | null
}

export interface QuoteTotals {
  totalOneTimePaise: number
  totalMonthlyPaise: number
}

export function computeQuoteTotals(lineItems: QuoteLineItemTotalsInput[]): QuoteTotals {
  return lineItems.reduce(
    (acc, item) => ({
      totalOneTimePaise: acc.totalOneTimePaise + (item.oneTimeFee ?? 0),
      totalMonthlyPaise: acc.totalMonthlyPaise + (item.monthlyFee ?? 0),
    }),
    { totalOneTimePaise: 0, totalMonthlyPaise: 0 }
  )
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}
```

- [ ] **Step 8: Run test — confirm it passes**

```bash
npm test -- tests/unit/quoteTotals.test.ts
```

Expected: 6 tests pass.

### 3c — Token helpers

- [ ] **Step 9: Write failing test at `tests/unit/token.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import { generateInviteToken, isTokenExpired, tokenExpiresAt, TOKEN_EXPIRY_DAYS } from "@/lib/leads/token"

describe("generateInviteToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateInviteToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]+$/)
  })

  it("returns unique tokens on each call", () => {
    expect(generateInviteToken()).not.toBe(generateInviteToken())
  })
})

describe("isTokenExpired", () => {
  it("returns false for a future expiry", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    expect(isTokenExpired(future)).toBe(false)
  })

  it("returns true for a past expiry", () => {
    const past = new Date(Date.now() - 1)
    expect(isTokenExpired(past)).toBe(true)
  })
})

describe("tokenExpiresAt", () => {
  it(`sets expiry to ${TOKEN_EXPIRY_DAYS} days from now`, () => {
    const before = Date.now()
    const expiresAt = tokenExpiresAt()
    const after = Date.now()
    const expectedMs = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedMs)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + expectedMs)
  })
})
```

- [ ] **Step 10: Run test — confirm it fails**

```bash
npm test -- tests/unit/token.test.ts
```

Expected: `Cannot find module '@/lib/leads/token'`

- [ ] **Step 11: Create `lib/leads/token.ts`**

```typescript
import { randomBytes } from "crypto"

export const TOKEN_EXPIRY_DAYS = 7

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex")
}

export function tokenExpiresAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + TOKEN_EXPIRY_DAYS)
  return d
}

export function isTokenExpired(expiresAt: Date): boolean {
  return Date.now() > expiresAt.getTime()
}
```

- [ ] **Step 12: Run all three tests — confirm all pass**

```bash
npm test -- tests/unit/equipment.test.ts tests/unit/quoteTotals.test.ts tests/unit/token.test.ts
```

Expected: 17 tests pass.

- [ ] **Step 13: Commit**

```bash
git add lib/onboarding/equipment.ts lib/leads/token.ts lib/leads/quote.ts tests/unit/equipment.test.ts tests/unit/quoteTotals.test.ts tests/unit/token.test.ts
git commit -m "feat: add equipment categorization, quote totals, token helpers with unit tests"
```

---

## Task 4: Zod validation schemas

**Files:**
- Create: `lib/validations/lead.ts`
- Create: `lib/validations/quote.ts`

- [ ] **Step 1: Create `lib/validations/lead.ts`**

```typescript
import { z } from "zod"

const VALID_MODULE_KEYS = [
  "TRAINERS",
  "ASSETS",
  "VENDING_MACHINES",
  "BRANDING",
  "MYGATE",
] as const

export const CreateLeadSchema = z.object({
  societyName: z.string().min(2, "Society name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional()
    .or(z.literal("")),
})
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

// Shape of the JSON stored in Lead.formData after RWA Admin completes the wizard.
// Mirrors the existing OnboardingPayloadSchema in app/api/onboarding/route.ts.
export const LeadFormSubmitSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  address: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  capacity: z.number().int().min(1).max(500),
  gymSqFt: z.number().int().min(100).optional(),
  rwaName: z.string().min(2),
  totalUnits: z.number().int().min(1),
  contactPersonName: z.string().min(2),
  contactPersonPhone: z
    .string()
    .regex(/^(\+91\s?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  contactPersonEmail: z.string().email(),
  selectedModules: z.array(z.enum(VALID_MODULE_KEYS)),
  trainerIds: z.array(z.string()).optional(),
  myGateSocietyId: z.string().optional(),
  myGateApiKey: z.string().optional(),
  myGateWebhookUrl: z.string().optional(),
  displayName: z.string().optional(),
})
export type LeadFormSubmitInput = z.infer<typeof LeadFormSubmitSchema>
```

- [ ] **Step 2: Create `lib/validations/quote.ts`**

```typescript
import { z } from "zod"

const VALID_MODULE_KEYS = [
  "TRAINERS",
  "ASSETS",
  "VENDING_MACHINES",
  "BRANDING",
  "MYGATE",
] as const

const VALID_PRICING_TYPES = [
  "MONTHLY",
  "ONE_TIME",
  "ONE_TIME_PLUS_TAKE_RATE",
] as const

export const QuoteLineItemSchema = z.object({
  moduleKey: z.enum(VALID_MODULE_KEYS),
  pricingType: z.enum(VALID_PRICING_TYPES),
  oneTimeFee: z.number().int().min(0).optional(),
  monthlyFee: z.number().int().min(0).optional(),
  takeRatePct: z.number().min(0).max(100).optional(),
})
export type QuoteLineItemInput = z.infer<typeof QuoteLineItemSchema>

export const CreateQuoteSchema = z.object({
  notes: z.string().optional(),
  lineItems: z.array(QuoteLineItemSchema).min(1, "At least one line item is required"),
})
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>

export const UpdatePricingConfigSchema = z.object({
  defaultOneTimeFee: z.number().int().min(0).optional(),
  defaultMonthlyFee: z.number().int().min(0).optional(),
  defaultTakeRatePct: z.number().min(0).max(100).optional(),
})
export type UpdatePricingConfigInput = z.infer<typeof UpdatePricingConfigSchema>
```

- [ ] **Step 3: Commit**

```bash
git add lib/validations/lead.ts lib/validations/quote.ts
git commit -m "feat: add lead and quote Zod validation schemas"
```

---

## Task 5: Seed data update

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add ServicePricingConfig, EquipmentRecommendation, and sample Leads to `prisma/seed.ts`**

Find the section near the bottom of `seed.ts` where tables are cleared (calls to `prisma.xxx.deleteMany()`). Add deletions for new tables **first** (to respect FK order):

```typescript
  await prisma.quoteLineItem.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.servicePricingConfig.deleteMany()
  await prisma.equipmentRecommendation.deleteMany()
```

Add these before the final `console.log` in the seed function:

```typescript
  // ─── ServicePricingConfig — default rate card ────────────────────────────────
  await prisma.servicePricingConfig.createMany({
    data: [
      {
        moduleKey: "TRAINERS",
        pricingType: "MONTHLY",
        defaultMonthlyFee: 1500000, // ₹15,000/month in paise
      },
      {
        moduleKey: "ASSETS",
        pricingType: "ONE_TIME",
        defaultOneTimeFee: 50000000, // ₹5,00,000 one-time in paise
      },
      {
        moduleKey: "VENDING_MACHINES",
        pricingType: "ONE_TIME_PLUS_TAKE_RATE",
        defaultOneTimeFee: 5000000, // ₹50,000 installation in paise
        defaultTakeRatePct: 8.5,
      },
      {
        moduleKey: "MYGATE",
        pricingType: "MONTHLY",
        defaultMonthlyFee: 500000, // ₹5,000/month in paise
      },
      {
        moduleKey: "BRANDING",
        pricingType: "ONE_TIME",
        defaultOneTimeFee: 2500000, // ₹25,000 one-time in paise
      },
    ],
  })

  // ─── EquipmentRecommendation — lookup table ───────────────────────────────────
  await prisma.equipmentRecommendation.createMany({
    data: [
      {
        sizeCategory: "SMALL",
        items: JSON.stringify([
          { name: "Treadmill", quantity: 2 },
          { name: "Upright Cycle", quantity: 1 },
          { name: "Dumbbell Rack (5–25 kg)", quantity: 1 },
        ]),
      },
      {
        sizeCategory: "MEDIUM",
        items: JSON.stringify([
          { name: "Treadmill", quantity: 4 },
          { name: "Upright Cycle", quantity: 2 },
          { name: "Elliptical", quantity: 2 },
          { name: "Free Weight Rack", quantity: 1 },
          { name: "Resistance Machine", quantity: 3 },
        ]),
      },
      {
        sizeCategory: "LARGE",
        items: JSON.stringify([
          { name: "Commercial Treadmill", quantity: 8 },
          { name: "Elliptical", quantity: 4 },
          { name: "Upright Cycle", quantity: 4 },
          { name: "Rowing Machine", quantity: 2 },
          { name: "Full Free Weight Suite", quantity: 1 },
          { name: "Resistance Machine", quantity: 6 },
          { name: "Functional Training Rig", quantity: 1 },
          { name: "Boxing Station", quantity: 1 },
        ]),
      },
    ],
  })

  // ─── Sample leads (for demo) ──────────────────────────────────────────────────
  // Lead 1: INVITED (not yet acted on)
  await prisma.lead.create({
    data: {
      societyName: "Godrej Emerald",
      contactName: "Rohit Sharma",
      contactEmail: "rohit@godrejemerald.in",
      contactPhone: "9876543210",
      status: "INVITED",
      inviteToken: "demo-token-invited-godrej-emerald-001",
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Lead 2: FORM_SUBMITTED (RWA filled wizard, CF Admin yet to price)
  const lead2 = await prisma.lead.create({
    data: {
      societyName: "Sobha Dream Acres",
      contactName: "Priya Nair",
      contactEmail: "priya@sobhadream.in",
      contactPhone: "9123456789",
      status: "FORM_SUBMITTED",
      inviteToken: "demo-token-submitted-sobha-001",
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      formData: JSON.stringify({
        name: "Sobha Dream Gym",
        code: "SOBHA-DRM-01",
        address: "Sobha Dream Acres, Panathur Road",
        city: "Bangalore",
        pincode: "560087",
        capacity: 60,
        gymSqFt: 1400,
        rwaName: "Sobha Dream Acres RWA",
        totalUnits: 340,
        contactPersonName: "Priya Nair",
        contactPersonPhone: "9123456789",
        contactPersonEmail: "priya@sobhadream.in",
        selectedModules: ["TRAINERS", "ASSETS", "MYGATE"],
        trainerIds: [],
      }),
    },
  })

  // Lead 3: QUOTE_SENT (CF Admin sent quote, awaiting RWA sign-off)
  const lead3 = await prisma.lead.create({
    data: {
      societyName: "Brigade Metropolis",
      contactName: "Anand Kumar",
      contactEmail: "anand@brigademetro.in",
      contactPhone: "9988776655",
      status: "QUOTE_SENT",
      inviteToken: "demo-token-quotesent-brigade-001",
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      formData: JSON.stringify({
        name: "Brigade Metropolis Gym",
        code: "BRIG-MTR-01",
        address: "Brigade Metropolis, Whitefield",
        city: "Bangalore",
        pincode: "560066",
        capacity: 100,
        gymSqFt: 2200,
        rwaName: "Brigade Metropolis RWA",
        totalUnits: 480,
        contactPersonName: "Anand Kumar",
        contactPersonPhone: "9988776655",
        contactPersonEmail: "anand@brigademetro.in",
        selectedModules: ["TRAINERS", "ASSETS", "VENDING_MACHINES", "MYGATE"],
        trainerIds: [],
      }),
    },
  })

  const quote3 = await prisma.quote.create({
    data: {
      leadId: lead3.id,
      status: "SENT",
      sentAt: new Date(),
      notes: "Standard pricing applied. Vending take rate negotiable.",
      lineItems: {
        create: [
          { moduleKey: "TRAINERS", pricingType: "MONTHLY", monthlyFee: 1500000 },
          { moduleKey: "ASSETS", pricingType: "ONE_TIME", oneTimeFee: 50000000 },
          {
            moduleKey: "VENDING_MACHINES",
            pricingType: "ONE_TIME_PLUS_TAKE_RATE",
            oneTimeFee: 5000000,
            takeRatePct: 8.5,
          },
          { moduleKey: "MYGATE", pricingType: "MONTHLY", monthlyFee: 500000 },
        ],
      },
    },
  })

  console.log(`Seeded: 5 pricing configs, 3 equipment recs, 3 leads, 1 quote`)
```

- [ ] **Step 2: Run seed**

```bash
npm run db:seed
```

Expected: completes without errors, logs `Seeded: 5 pricing configs, 3 equipment recs, 3 leads, 1 quote`

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed ServicePricingConfig, EquipmentRecommendation, and sample leads"
```

---

## Task 6: API — Lead CRUD

**Files:**
- Create: `app/api/leads/route.ts`
- Create: `app/api/leads/[id]/route.ts`

- [ ] **Step 1: Create `app/api/leads/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { CreateLeadSchema } from "@/lib/validations/lead"
import { generateInviteToken, tokenExpiresAt } from "@/lib/leads/token"

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { quote: { select: { status: true } } },
  })
  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateLeadSchema.parse(body)
    const lead = await prisma.lead.create({
      data: {
        societyName: data.societyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        status: "INVITED",
        inviteToken: generateInviteToken(),
        inviteExpiresAt: tokenExpiresAt(),
      },
    })
    return NextResponse.json(
      { leadId: lead.id, inviteToken: lead.inviteToken },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    console.error("Create lead error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `app/api/leads/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      quote: { include: { lineItems: true } },
    },
  })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  let equipmentCategory: string | null = null
  if (lead.formData) {
    try {
      const fd = JSON.parse(lead.formData)
      if (fd.gymSqFt && fd.totalUnits) {
        equipmentCategory = deriveEquipmentCategory(fd.gymSqFt, fd.totalUnits)
      }
    } catch {
      // formData may be malformed; ignore
    }
  }

  let equipmentRecommendation = null
  if (equipmentCategory) {
    equipmentRecommendation = await prisma.equipmentRecommendation.findUnique({
      where: { sizeCategory: equipmentCategory },
    })
  }

  return NextResponse.json({ lead, equipmentCategory, equipmentRecommendation })
}
```

- [ ] **Step 3: Verify both routes work**

```bash
# Start dev server in background if not running
npm run dev &

curl -s http://localhost:3000/api/leads | jq '.leads | length'
# Expected: 3 (from seed)

curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"societyName":"Test Society","contactName":"Test User","contactEmail":"test@test.com"}' | jq
# Expected: { leadId: "...", inviteToken: "..." }
```

- [ ] **Step 4: Commit**

```bash
git add app/api/leads/
git commit -m "feat: add GET/POST /api/leads and GET /api/leads/[id]"
```

---

## Task 7: API — Token validation + form submission

**Files:**
- Create: `app/api/leads/token/[token]/route.ts`
- Create: `app/api/leads/[id]/submit/route.ts`

- [ ] **Step 1: Create `app/api/leads/token/[token]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { isTokenExpired } from "@/lib/leads/token"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const lead = await prisma.lead.findUnique({ where: { inviteToken: token } })

  if (!lead) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
  }
  if (isTokenExpired(lead.inviteExpiresAt)) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 410 })
  }
  if (lead.status !== "INVITED") {
    return NextResponse.json(
      { error: "This setup link has already been used" },
      { status: 409 }
    )
  }

  return NextResponse.json({
    lead: {
      id: lead.id,
      societyName: lead.societyName,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
    },
  })
}
```

- [ ] **Step 2: Create `app/api/leads/[id]/submit/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { LeadFormSubmitSchema } from "@/lib/validations/lead"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const lead = await prisma.lead.findUnique({ where: { id } })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }
    if (lead.status !== "INVITED") {
      return NextResponse.json({ error: "Form already submitted" }, { status: 409 })
    }

    const body = await req.json()
    const data = LeadFormSubmitSchema.parse(body)

    await prisma.lead.update({
      where: { id },
      data: {
        status: "FORM_SUBMITTED",
        formData: JSON.stringify(data),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    console.error("Lead submit error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/leads/token/ app/api/leads/[id]/submit/
git commit -m "feat: add token validation and form submission API routes"
```

---

## Task 8: API — Quote lifecycle

**Files:**
- Create: `app/api/leads/[id]/quote/route.ts`
- Create: `app/api/leads/[id]/quote/send/route.ts`
- Create: `app/api/leads/[id]/quote/accept/route.ts`
- Create: `app/api/leads/[id]/quote/reject/route.ts`

- [ ] **Step 1: Create `app/api/leads/[id]/quote/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { CreateQuoteSchema } from "@/lib/validations/quote"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { quote: true },
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }
    if (lead.status !== "FORM_SUBMITTED") {
      return NextResponse.json(
        { error: "Cannot create quote: form not submitted yet" },
        { status: 409 }
      )
    }

    const body = await req.json()
    const data = CreateQuoteSchema.parse(body)

    const quote = await prisma.$transaction(async (tx) => {
      if (lead.quote) {
        await tx.quoteLineItem.deleteMany({ where: { quoteId: lead.quote.id } })
        await tx.quote.delete({ where: { id: lead.quote.id } })
      }
      return tx.quote.create({
        data: {
          leadId: id,
          status: "DRAFT",
          notes: data.notes ?? null,
          lineItems: {
            create: data.lineItems.map((item) => ({
              moduleKey: item.moduleKey,
              pricingType: item.pricingType,
              oneTimeFee: item.oneTimeFee ?? null,
              monthlyFee: item.monthlyFee ?? null,
              takeRatePct: item.takeRatePct ?? null,
            })),
          },
        },
        include: { lineItems: true },
      })
    })

    return NextResponse.json({ quote }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    console.error("Quote create error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `app/api/leads/[id]/quote/send/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: true },
  })

  if (!lead?.quote) {
    return NextResponse.json({ error: "No quote found" }, { status: 404 })
  }
  if (lead.quote.status !== "DRAFT") {
    return NextResponse.json({ error: "Quote is not in DRAFT status" }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: lead.quote.id },
      data: { status: "SENT", sentAt: new Date() },
    }),
    prisma.lead.update({
      where: { id },
      data: { status: "QUOTE_SENT" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/api/leads/[id]/quote/reject/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: true },
  })

  if (!lead?.quote) {
    return NextResponse.json({ error: "No quote found" }, { status: 404 })
  }
  if (lead.quote.status !== "SENT") {
    return NextResponse.json({ error: "Quote is not in SENT status" }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: lead.quote.id },
      data: { status: "REJECTED" },
    }),
    prisma.lead.update({
      where: { id },
      data: { status: "REJECTED" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create `app/api/leads/[id]/quote/accept/route.ts`**

This route is the most complex: it creates a Center from the lead's `formData`, exactly as `/api/onboarding` does, but reading inputs from the stored JSON.

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { LeadFormSubmitSchema } from "@/lib/validations/lead"

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: { include: { lineItems: true } } },
  })

  if (!lead?.quote) {
    return NextResponse.json({ error: "No quote found" }, { status: 404 })
  }
  if (lead.quote.status !== "SENT") {
    return NextResponse.json({ error: "Quote is not in SENT status" }, { status: 409 })
  }
  if (!lead.formData) {
    return NextResponse.json({ error: "No form data on lead" }, { status: 400 })
  }

  let formData: ReturnType<typeof LeadFormSubmitSchema.parse>
  try {
    formData = LeadFormSubmitSchema.parse(JSON.parse(lead.formData))
  } catch {
    return NextResponse.json({ error: "Stored form data is invalid" }, { status: 400 })
  }

  // Check for duplicate center code
  const existing = await prisma.center.findUnique({ where: { code: formData.code } })
  if (existing) {
    return NextResponse.json(
      { error: `Center code ${formData.code} already exists` },
      { status: 409 }
    )
  }

  const center = await prisma.$transaction(async (tx) => {
    const center = await tx.center.create({
      data: {
        name: formData.name,
        code: formData.code,
        status: "ONBOARDING",
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        capacity: formData.capacity,
        gymSqFt: formData.gymSqFt ?? null,
      },
    })

    await tx.residentialDetails.create({
      data: {
        centerId: center.id,
        rwaName: formData.rwaName,
        totalUnits: formData.totalUnits,
        contactPersonName: formData.contactPersonName,
        contactPersonPhone: formData.contactPersonPhone,
        contactPersonEmail: formData.contactPersonEmail,
      },
    })

    if (formData.selectedModules.length > 0) {
      await tx.centerModule.createMany({
        data: formData.selectedModules.map((moduleKey) => ({
          centerId: center.id,
          moduleKey,
          isEnabled: true,
          config:
            moduleKey === "BRANDING" && formData.displayName
              ? JSON.stringify({ displayName: formData.displayName })
              : null,
        })),
      })
    }

    if (
      formData.selectedModules.includes("MYGATE") &&
      formData.myGateSocietyId &&
      formData.myGateApiKey
    ) {
      await tx.myGateConfig.create({
        data: {
          centerId: center.id,
          societyId: formData.myGateSocietyId,
          apiKey: formData.myGateApiKey,
          webhookUrl: formData.myGateWebhookUrl ?? null,
          isActive: false,
        },
      })
    }

    if (formData.trainerIds?.length) {
      await tx.centerTrainerMapping.createMany({
        data: formData.trainerIds.map((trainerId) => ({
          centerId: center.id,
          trainerId,
          isActive: true,
        })),
      })
    }

    await tx.lead.update({
      where: { id },
      data: { status: "ACCEPTED", centerId: center.id },
    })

    await tx.quote.update({
      where: { id: lead.quote!.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    })

    return center
  })

  return NextResponse.json({ centerId: center.id, code: center.code })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/leads/[id]/quote/
git commit -m "feat: add quote lifecycle API routes (create, send, accept, reject)"
```

---

## Task 9: API — Pricing config

**Files:**
- Create: `app/api/pricing/route.ts`
- Create: `app/api/pricing/[moduleKey]/route.ts`

- [ ] **Step 1: Create `app/api/pricing/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

export async function GET() {
  const configs = await prisma.servicePricingConfig.findMany({
    orderBy: { moduleKey: "asc" },
  })
  return NextResponse.json({ configs })
}
```

- [ ] **Step 2: Create `app/api/pricing/[moduleKey]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { z } from "zod"
import { UpdatePricingConfigSchema } from "@/lib/validations/quote"

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const { moduleKey } = await context.params
    const body = await req.json()
    const data = UpdatePricingConfigSchema.parse(body)

    const config = await prisma.servicePricingConfig.update({
      where: { moduleKey },
      data,
    })

    return NextResponse.json({ config })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      )
    }
    console.error("Pricing update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/pricing/
git commit -m "feat: add pricing config API routes (GET all, PUT per module)"
```

---

## Task 10: ModuleSelector — add payment type label

**Files:**
- Modify: `components/onboarding/ModuleSelector.tsx`

The module cards shown to RWA Admin should display the payment type label (e.g. "Monthly rate") under the description. Import `MODULE_PRICING_LABEL` from enums.

- [ ] **Step 1: Update `components/onboarding/ModuleSelector.tsx`**

Add the import at the top (after existing imports):

```typescript
import { CENTER_MODULE_META, MODULE_PRICING_LABEL, type CenterModuleKey } from "@/lib/constants/enums"
```

Replace the `{/* Text */}` section inside the button (the `<div className="min-w-0">` block) with:

```tsx
{/* Text */}
<div className="min-w-0">
  <p
    className={cn(
      "text-sm font-semibold leading-tight",
      isSelected ? "text-white" : "text-[#f9fafb]"
    )}
  >
    {module.label}
  </p>
  <p className="mt-0.5 text-xs text-[#9ca3af] leading-relaxed">
    {module.description}
  </p>
  <p className="mt-1 text-[10px] font-medium text-cyan-500/70 uppercase tracking-wide">
    {MODULE_PRICING_LABEL[module.key]}
  </p>
</div>
```

- [ ] **Step 2: Run existing onboarding tests to confirm no regressions**

```bash
npm test -- tests/unit/onboarding.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/ModuleSelector.tsx
git commit -m "feat: show payment type label on module selector cards"
```

---

## Task 11: CF Admin — Lead pipeline page

**Files:**
- Create: `app/cf-admin/leads/page.tsx`
- Create: `components/leads/LeadPipelineTable.tsx`

- [ ] **Step 1: Create `components/leads/LeadPipelineTable.tsx`**

```tsx
"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDistanceToNow } from "@/lib/utils/date"
import { ChevronRight, Mail } from "lucide-react"

interface Lead {
  id: string
  societyName: string
  contactName: string
  contactEmail: string
  status: string
  createdAt: string | Date
  quote: { status: string } | null
}

interface LeadPipelineTableProps {
  leads: Lead[]
}

export function LeadPipelineTable({ leads }: LeadPipelineTableProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#1f2937] p-16 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#1f2937] border border-[#374151] mx-auto mb-4">
          <Mail className="w-6 h-6 text-[#6b7280]" />
        </div>
        <p className="text-sm font-medium text-[#f9fafb] mb-1">No leads yet</p>
        <p className="text-xs text-[#6b7280]">Create your first lead to start onboarding an RWA gym.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <Link
          key={lead.id}
          href={`/cf-admin/leads/${lead.id}`}
          className="flex items-center justify-between rounded-xl border border-[#1f2937] bg-[#111827] px-5 py-4 hover:bg-[#1a2235] hover:border-[#374151] transition-colors"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1f2937] border border-[#374151] shrink-0">
              <Mail className="w-4 h-4 text-[#6b7280]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-sm font-semibold text-white">{lead.societyName}</p>
                <StatusBadge status={lead.status} showDot />
                {lead.quote && <StatusBadge status={lead.quote.status} />}
              </div>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {lead.contactName} · {lead.contactEmail} ·{" "}
                {formatDistanceToNow(new Date(lead.createdAt))} ago
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#374151] shrink-0" />
        </Link>
      ))}
    </div>
  )
}
```

You need a small date utility. Create `lib/utils/date.ts`:

```typescript
export function formatDistanceToNow(date: Date): string {
  const ms = Date.now() - date.getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
```

- [ ] **Step 2: Create `app/cf-admin/leads/page.tsx`**

```tsx
import Link from "next/link"
import { prisma } from "@/lib/db/client"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Button } from "@/components/ui/button"
import { LeadPipelineTable } from "@/components/leads/LeadPipelineTable"
import { Plus } from "lucide-react"

async function getLeads() {
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { quote: { select: { status: true } } },
  })
}

export default async function LeadsPage() {
  const leads = await getLeads()

  return (
    <div className="p-8">
      <SectionHeader
        title="Lead Pipeline"
        description="Invite RWA societies and track them through onboarding."
        action={
          <Link href="/cf-admin/leads/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Lead
            </Button>
          </Link>
        }
      />
      <LeadPipelineTable leads={leads} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/cf-admin/leads/page.tsx components/leads/LeadPipelineTable.tsx lib/utils/date.ts
git commit -m "feat: CF Admin lead pipeline page"
```

---

## Task 12: CF Admin — Create lead page

**Files:**
- Create: `app/cf-admin/leads/new/page.tsx`
- Create: `components/leads/CreateLeadForm.tsx`

- [ ] **Step 1: Create `components/leads/CreateLeadForm.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { CreateLeadSchema, type CreateLeadInput } from "@/lib/validations/lead"
import { FormField } from "@/components/onboarding/FormField"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle } from "lucide-react"

export function CreateLeadForm() {
  const router = useRouter()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadInput>({ resolver: zodResolver(CreateLeadSchema) })

  async function onSubmit(data: CreateLeadInput) {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to create lead")
      }
      const { leadId, inviteToken } = await res.json()
      const url = `${window.location.origin}/rwa-admin/setup/${inviteToken}`
      setInviteUrl(url)
      // Pre-fetch leads list in background
      router.prefetch("/cf-admin/leads")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inviteUrl) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-emerald-400">Lead created — invite link ready</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="form-input flex-1 text-xs font-mono"
          />
          <Button size="sm" variant="outline" onClick={copyUrl} type="button">
            {copied ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-[#6b7280]">
          Share this link with the RWA Admin. It expires in 7 days.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/cf-admin/leads")}
          type="button"
        >
          Back to Lead Pipeline
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <FormField label="Society / RWA Name" error={errors.societyName?.message} required>
        <input
          {...register("societyName")}
          placeholder="Prestige Lakeside Habitat"
          className="form-input"
        />
      </FormField>

      <FormField label="Contact Person Name" error={errors.contactName?.message} required>
        <input
          {...register("contactName")}
          placeholder="Rajesh Kumar"
          className="form-input"
        />
      </FormField>

      <FormField label="Contact Email" error={errors.contactEmail?.message} required>
        <input
          {...register("contactEmail")}
          type="email"
          placeholder="rajesh@rwa.in"
          className="form-input"
        />
      </FormField>

      <FormField
        label="Contact Phone"
        error={errors.contactPhone?.message}
        hint="Optional — Indian mobile number"
      >
        <input
          {...register("contactPhone")}
          placeholder="9876543210"
          className="form-input"
        />
      </FormField>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Lead & Generate Invite Link"}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `app/cf-admin/leads/new/page.tsx`**

```tsx
import Link from "next/link"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Button } from "@/components/ui/button"
import { CreateLeadForm } from "@/components/leads/CreateLeadForm"
import { ArrowLeft } from "lucide-react"

export default function NewLeadPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/cf-admin/leads">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Button>
        </Link>
      </div>
      <SectionHeader
        title="New Lead"
        description="Enter the RWA contact details. You'll get an invite link to share with them."
      />
      <CreateLeadForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/cf-admin/leads/new/ components/leads/CreateLeadForm.tsx
git commit -m "feat: CF Admin create lead page with invite link generation"
```

---

## Task 13: CF Admin — Lead detail page

**Files:**
- Create: `app/cf-admin/leads/[id]/page.tsx`
- Create: `components/leads/LeadReviewPanel.tsx`
- Create: `components/leads/EquipmentRecommendationPanel.tsx`

- [ ] **Step 1: Create `components/leads/EquipmentRecommendationPanel.tsx`**

```tsx
interface EquipmentItem {
  name: string
  quantity: number
}

interface EquipmentRecommendationPanelProps {
  sizeCategory: string
  items: EquipmentItem[]
}

export function EquipmentRecommendationPanel({
  sizeCategory,
  items,
}: EquipmentRecommendationPanelProps) {
  return (
    <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Equipment Recommendation</p>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {sizeCategory}
        </span>
      </div>
      <p className="text-xs text-[#6b7280] mb-4">
        Based on gym size and household count. Use this to inform your pricing.
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between">
            <span className="text-sm text-[#d1d5db]">{item.name}</span>
            <span className="text-xs font-semibold text-cyan-400">×{item.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/leads/LeadReviewPanel.tsx`**

```tsx
interface FormDataSnapshot {
  name?: string
  code?: string
  address?: string
  city?: string
  pincode?: string
  capacity?: number
  gymSqFt?: number
  rwaName?: string
  totalUnits?: number
  contactPersonName?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
  selectedModules?: string[]
}

interface LeadReviewPanelProps {
  formData: FormDataSnapshot
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-[#1f2937] last:border-0">
      <span className="text-xs text-[#6b7280]">{label}</span>
      <span className="text-xs font-medium text-[#f9fafb]">{value}</span>
    </div>
  )
}

export function LeadReviewPanel({ formData }: LeadReviewPanelProps) {
  return (
    <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5 space-y-1">
      <p className="text-sm font-semibold text-white mb-3">Submitted Form Data</p>
      <Row label="Center Name" value={formData.name} />
      <Row label="Code" value={formData.code} />
      <Row label="Address" value={formData.address ? `${formData.address}, ${formData.city} ${formData.pincode}` : undefined} />
      <Row label="Capacity" value={formData.capacity} />
      <Row label="Gym Sq Ft" value={formData.gymSqFt ? `${formData.gymSqFt} sq ft` : undefined} />
      <Row label="RWA" value={formData.rwaName} />
      <Row label="Total Units" value={formData.totalUnits} />
      <Row label="Contact" value={formData.contactPersonName} />
      <Row label="Phone" value={formData.contactPersonPhone} />
      <Row label="Email" value={formData.contactPersonEmail} />
      {formData.selectedModules && formData.selectedModules.length > 0 && (
        <div className="flex justify-between pt-2">
          <span className="text-xs text-[#6b7280]">Selected Modules</span>
          <div className="flex gap-1 flex-wrap justify-end max-w-xs">
            {formData.selectedModules.map((m) => (
              <span
                key={m}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1f2937] text-[#6b7280] border border-[#374151]"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/cf-admin/leads/[id]/page.tsx`**

```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { LeadReviewPanel } from "@/components/leads/LeadReviewPanel"
import { EquipmentRecommendationPanel } from "@/components/leads/EquipmentRecommendationPanel"
import { deriveEquipmentCategory } from "@/lib/onboarding/equipment"
import { ArrowLeft } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: { include: { lineItems: true } } },
  })
  if (!lead) notFound()

  let formData: Record<string, unknown> | null = null
  let equipmentCategory: string | null = null
  let equipmentItems: Array<{ name: string; quantity: number }> = []

  if (lead.formData) {
    try {
      formData = JSON.parse(lead.formData)
      if (formData?.gymSqFt && formData?.totalUnits) {
        equipmentCategory = deriveEquipmentCategory(
          formData.gymSqFt as number,
          formData.totalUnits as number
        )
        const rec = await prisma.equipmentRecommendation.findUnique({
          where: { sizeCategory: equipmentCategory },
        })
        if (rec) equipmentItems = JSON.parse(rec.items)
      }
    } catch {
      // ignore
    }
  }

  const canBuildQuote = lead.status === "FORM_SUBMITTED"

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/cf-admin/leads">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <SectionHeader
            title={lead.societyName}
            description={`${lead.contactName} · ${lead.contactEmail}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.status} showDot size="md" />
          {canBuildQuote && (
            <Link href={`/cf-admin/leads/${lead.id}/quote`}>
              <Button size="sm">Build Quote</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {formData ? (
            <LeadReviewPanel formData={formData} />
          ) : (
            <div className="rounded-xl border border-dashed border-[#1f2937] p-8 text-center">
              <p className="text-sm text-[#6b7280]">
                Waiting for RWA Admin to complete the setup wizard.
              </p>
              <p className="text-xs text-[#4b5563] mt-1 font-mono break-all">
                Invite token: {lead.inviteToken}
              </p>
            </div>
          )}
        </div>

        <div>
          {equipmentCategory && equipmentItems.length > 0 && (
            <EquipmentRecommendationPanel
              sizeCategory={equipmentCategory}
              items={equipmentItems}
            />
          )}
        </div>
      </div>

      {lead.quote && (
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Quote</p>
            <StatusBadge status={lead.quote.status} showDot />
          </div>
          {lead.status === "FORM_SUBMITTED" && lead.quote.status === "DRAFT" && (
            <Link href={`/cf-admin/leads/${lead.id}/quote`}>
              <Button size="sm" variant="outline">Edit Quote</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/cf-admin/leads/[id]/ components/leads/LeadReviewPanel.tsx components/leads/EquipmentRecommendationPanel.tsx
git commit -m "feat: CF Admin lead detail page with equipment recommendation"
```

---

## Task 14: CF Admin — Quote builder page

**Files:**
- Create: `app/cf-admin/leads/[id]/quote/page.tsx`
- Create: `components/leads/QuoteLineItemRow.tsx`
- Create: `components/leads/QuoteBuilder.tsx`

- [ ] **Step 1: Create `components/leads/QuoteLineItemRow.tsx`**

```tsx
import { type UseFormRegister, type FieldErrors } from "react-hook-form"
import { type CreateQuoteInput } from "@/lib/validations/quote"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"
import { formatPaise } from "@/lib/leads/quote"

interface QuoteLineItemRowProps {
  index: number
  moduleKey: string
  pricingType: string
  register: UseFormRegister<CreateQuoteInput>
  errors: FieldErrors<CreateQuoteInput>
  defaultOneTimeFee?: number | null
  defaultMonthlyFee?: number | null
  defaultTakeRatePct?: number | null
}

export function QuoteLineItemRow({
  index,
  moduleKey,
  pricingType,
  register,
  errors,
}: QuoteLineItemRowProps) {
  const rowErrors = errors.lineItems?.[index]

  return (
    <div className="flex items-start gap-4 rounded-xl border border-[#1f2937] bg-[#0f1623] px-5 py-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-white">{moduleKey}</p>
          <span className="text-[10px] font-medium text-[#6b7280] uppercase tracking-wide">
            {MODULE_PRICING_LABEL[moduleKey as keyof typeof MODULE_PRICING_LABEL]}
          </span>
        </div>

        <input type="hidden" {...register(`lineItems.${index}.moduleKey`)} />
        <input type="hidden" {...register(`lineItems.${index}.pricingType`)} />

        <div className="grid grid-cols-2 gap-3">
          {(pricingType === "ONE_TIME" || pricingType === "ONE_TIME_PLUS_TAKE_RATE") && (
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">One-time fee (paise)</label>
              <input
                type="number"
                min="0"
                step="1"
                {...register(`lineItems.${index}.oneTimeFee`, { valueAsNumber: true })}
                className="form-input"
                placeholder="e.g. 5000000 = ₹50,000"
              />
              {rowErrors?.oneTimeFee && (
                <p className="text-xs text-red-400 mt-1">{rowErrors.oneTimeFee.message}</p>
              )}
            </div>
          )}

          {(pricingType === "MONTHLY") && (
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Monthly fee (paise)</label>
              <input
                type="number"
                min="0"
                step="1"
                {...register(`lineItems.${index}.monthlyFee`, { valueAsNumber: true })}
                className="form-input"
                placeholder="e.g. 1500000 = ₹15,000"
              />
              {rowErrors?.monthlyFee && (
                <p className="text-xs text-red-400 mt-1">{rowErrors.monthlyFee.message}</p>
              )}
            </div>
          )}

          {pricingType === "ONE_TIME_PLUS_TAKE_RATE" && (
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Take rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                {...register(`lineItems.${index}.takeRatePct`, { valueAsNumber: true })}
                className="form-input"
                placeholder="e.g. 8.5"
              />
              {rowErrors?.takeRatePct && (
                <p className="text-xs text-red-400 mt-1">{rowErrors.takeRatePct.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/leads/QuoteBuilder.tsx`**

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CreateQuoteSchema, type CreateQuoteInput } from "@/lib/validations/quote"
import { MODULE_PRICING_TYPE } from "@/lib/constants/enums"
import { QuoteLineItemRow } from "./QuoteLineItemRow"
import { Button } from "@/components/ui/button"

interface PricingConfig {
  moduleKey: string
  pricingType: string
  defaultOneTimeFee?: number | null
  defaultMonthlyFee?: number | null
  defaultTakeRatePct?: number | null
}

interface QuoteBuilderProps {
  leadId: string
  selectedModules: string[]
  pricingConfigs: PricingConfig[]
}

export function QuoteBuilder({ leadId, selectedModules, pricingConfigs }: QuoteBuilderProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const configByKey = Object.fromEntries(pricingConfigs.map((c) => [c.moduleKey, c]))

  const defaultLineItems = selectedModules.map((moduleKey) => {
    const config = configByKey[moduleKey]
    const pricingType = MODULE_PRICING_TYPE[moduleKey as keyof typeof MODULE_PRICING_TYPE] ?? "ONE_TIME"
    return {
      moduleKey,
      pricingType,
      oneTimeFee: config?.defaultOneTimeFee ?? undefined,
      monthlyFee: config?.defaultMonthlyFee ?? undefined,
      takeRatePct: config?.defaultTakeRatePct ?? undefined,
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(CreateQuoteSchema),
    defaultValues: { lineItems: defaultLineItems },
  })

  async function saveQuote(data: CreateQuoteInput) {
    const res = await fetch(`/api/leads/${leadId}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? "Failed to save quote")
    }
    return res.json()
  }

  async function onSave(data: CreateQuoteInput) {
    setIsSaving(true)
    setServerError(null)
    try {
      await saveQuote(data)
      router.refresh()
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setIsSaving(false)
    }
  }

  async function onSendQuote(data: CreateQuoteInput) {
    setIsSending(true)
    setServerError(null)
    try {
      await saveQuote(data)
      const sendRes = await fetch(`/api/leads/${leadId}/quote/send`, { method: "POST" })
      if (!sendRes.ok) {
        const body = await sendRes.json()
        throw new Error(body.error ?? "Failed to send quote")
      }
      router.push(`/cf-admin/leads/${leadId}`)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className="space-y-4">
      {selectedModules.map((moduleKey, index) => {
        const pricingType =
          MODULE_PRICING_TYPE[moduleKey as keyof typeof MODULE_PRICING_TYPE] ?? "ONE_TIME"
        return (
          <QuoteLineItemRow
            key={moduleKey}
            index={index}
            moduleKey={moduleKey}
            pricingType={pricingType}
            register={register}
            errors={errors}
          />
        )
      })}

      {serverError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={handleSubmit(onSave)}
        >
          {isSaving ? "Saving…" : "Save Draft"}
        </Button>
        <Button
          type="button"
          disabled={isSending}
          onClick={handleSubmit(onSendQuote)}
        >
          {isSending ? "Sending…" : "Send Quote to RWA Admin"}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create `app/cf-admin/leads/[id]/quote/page.tsx`**

```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Button } from "@/components/ui/button"
import { QuoteBuilder } from "@/components/leads/QuoteBuilder"
import { ArrowLeft } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuoteBuilderPage({ params }: Props) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { quote: { include: { lineItems: true } } },
  })
  if (!lead) notFound()
  if (lead.status !== "FORM_SUBMITTED") {
    return (
      <div className="p-8">
        <p className="text-sm text-[#6b7280]">
          Cannot build quote: lead is in status <strong>{lead.status}</strong>.
        </p>
      </div>
    )
  }

  let selectedModules: string[] = []
  if (lead.formData) {
    try {
      const fd = JSON.parse(lead.formData)
      selectedModules = fd.selectedModules ?? []
    } catch {
      // ignore
    }
  }

  const pricingConfigs = await prisma.servicePricingConfig.findMany()

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href={`/cf-admin/leads/${id}`}>
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4" />
            Back to Lead
          </Button>
        </Link>
      </div>
      <SectionHeader
        title={`Quote — ${lead.societyName}`}
        description="Set pricing per module. Amounts are in paise (₹1 = 100 paise)."
      />
      <QuoteBuilder
        leadId={lead.id}
        selectedModules={selectedModules}
        pricingConfigs={pricingConfigs}
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/cf-admin/leads/[id]/quote/ components/leads/QuoteLineItemRow.tsx components/leads/QuoteBuilder.tsx
git commit -m "feat: CF Admin quote builder page"
```

---

## Task 15: CF Admin — Pricing config page

**Files:**
- Create: `app/cf-admin/pricing/page.tsx`
- Create: `components/leads/PricingConfigTable.tsx`

- [ ] **Step 1: Create `components/leads/PricingConfigTable.tsx`**

```tsx
"use client"

import { useState } from "react"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"
import { formatPaise } from "@/lib/leads/quote"
import { Button } from "@/components/ui/button"

interface PricingConfig {
  id: string
  moduleKey: string
  pricingType: string
  defaultOneTimeFee?: number | null
  defaultMonthlyFee?: number | null
  defaultTakeRatePct?: number | null
}

interface PricingConfigTableProps {
  configs: PricingConfig[]
}

function PricingRow({ config }: { config: PricingConfig }) {
  const [saving, setSaving] = useState(false)
  const [oneTimeFee, setOneTimeFee] = useState<string>(
    config.defaultOneTimeFee?.toString() ?? ""
  )
  const [monthlyFee, setMonthlyFee] = useState<string>(
    config.defaultMonthlyFee?.toString() ?? ""
  )
  const [takeRatePct, setTakeRatePct] = useState<string>(
    config.defaultTakeRatePct?.toString() ?? ""
  )
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/pricing/${config.moduleKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultOneTimeFee: oneTimeFee ? parseInt(oneTimeFee) : undefined,
        defaultMonthlyFee: monthlyFee ? parseInt(monthlyFee) : undefined,
        defaultTakeRatePct: takeRatePct ? parseFloat(takeRatePct) : undefined,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#1f2937] bg-[#111827] px-5 py-4">
      <div className="w-40 shrink-0">
        <p className="text-sm font-semibold text-white">{config.moduleKey}</p>
        <p className="text-xs text-[#6b7280]">
          {MODULE_PRICING_LABEL[config.moduleKey as keyof typeof MODULE_PRICING_LABEL]}
        </p>
      </div>

      <div className="flex gap-3 flex-1">
        {(config.pricingType === "ONE_TIME" ||
          config.pricingType === "ONE_TIME_PLUS_TAKE_RATE") && (
          <div className="flex-1">
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wide mb-1 block">
              One-time fee (paise)
            </label>
            <input
              type="number"
              value={oneTimeFee}
              onChange={(e) => setOneTimeFee(e.target.value)}
              className="form-input text-xs"
            />
            {oneTimeFee && (
              <p className="text-[10px] text-[#6b7280] mt-0.5">= {formatPaise(parseInt(oneTimeFee))}</p>
            )}
          </div>
        )}

        {config.pricingType === "MONTHLY" && (
          <div className="flex-1">
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wide mb-1 block">
              Monthly fee (paise)
            </label>
            <input
              type="number"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              className="form-input text-xs"
            />
            {monthlyFee && (
              <p className="text-[10px] text-[#6b7280] mt-0.5">= {formatPaise(parseInt(monthlyFee))}/mo</p>
            )}
          </div>
        )}

        {config.pricingType === "ONE_TIME_PLUS_TAKE_RATE" && (
          <div className="w-32">
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wide mb-1 block">
              Take rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={takeRatePct}
              onChange={(e) => setTakeRatePct(e.target.value)}
              className="form-input text-xs"
            />
          </div>
        )}
      </div>

      <Button size="sm" variant="outline" onClick={save} disabled={saving} type="button">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </Button>
    </div>
  )
}

export function PricingConfigTable({ configs }: PricingConfigTableProps) {
  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <PricingRow key={config.moduleKey} config={config} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/cf-admin/pricing/page.tsx`**

```tsx
import { prisma } from "@/lib/db/client"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { PricingConfigTable } from "@/components/leads/PricingConfigTable"

export default async function PricingPage() {
  const configs = await prisma.servicePricingConfig.findMany({
    orderBy: { moduleKey: "asc" },
  })

  return (
    <div className="p-8">
      <SectionHeader
        title="Default Rate Card"
        description="These defaults are pre-filled in the quote builder. Adjust per deal in the quote."
      />
      <PricingConfigTable configs={configs} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/cf-admin/pricing/ components/leads/PricingConfigTable.tsx
git commit -m "feat: CF Admin pricing config page"
```

---

## Task 16: RWA Admin — Setup wizard

**Files:**
- Create: `components/onboarding/RWASetupShell.tsx`
- Create: `app/rwa-admin/setup/[token]/page.tsx`

The wizard reuses all existing step components from `components/onboarding/`. The only difference from `OnboardingShell` is:
- It receives `leadId` as a prop
- Submit posts to `/api/leads/[leadId]/submit` instead of `/api/onboarding`
- On success shows a "Submitted — waiting for CF Admin" screen instead of redirecting to CF Admin

- [ ] **Step 1: Create `components/onboarding/RWASetupShell.tsx`**

Read `components/onboarding/OnboardingShell.tsx` first to understand the state structure and step rendering, then create this file:

```tsx
"use client"

import { useState } from "react"
import { Stepper } from "@/components/shared/Stepper"
import { deriveOnboardingSteps } from "@/lib/onboarding/steps"
import { StepGymDetails } from "./StepGymDetails"
import { StepModuleSelection } from "./StepModuleSelection"
import { StepTrainerSetup } from "./StepTrainerSetup"
import { StepAssetSetup } from "./StepAssetSetup"
import { StepMyGateConfig } from "./StepMyGateConfig"
import { StepVendingSetup } from "./StepVendingSetup"
import { StepBrandingSetup } from "./StepBrandingSetup"
import { StepReview } from "./StepReview"
import type { CenterModuleKey } from "@/lib/constants/enums"
import type { OnboardingStep1 } from "@/lib/validations/center"
import type { MyGateConfig } from "@/lib/validations/center"

interface Trainer {
  id: string
  name: string
  trainerType: string
}

interface RWASetupShellProps {
  leadId: string
  trainers: Trainer[]
}

interface WizardData {
  step1: OnboardingStep1 | null
  selectedModules: CenterModuleKey[]
  selectedTrainerIds: string[]
  myGateConfig: MyGateConfig | null
  displayName: string
}

export function RWASetupShell({ leadId, trainers }: RWASetupShellProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState<WizardData>({
    step1: null,
    selectedModules: [],
    selectedTrainerIds: [],
    myGateConfig: null,
    displayName: "",
  })

  const steps = deriveOnboardingSteps(data.selectedModules)
  const currentStep = steps[currentStepIndex]

  function goNext() {
    setCurrentStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }
  function goBack() {
    setCurrentStepIndex((i) => Math.max(i - 1, 0))
  }

  async function handleSubmit() {
    if (!data.step1) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        ...data.step1,
        selectedModules: data.selectedModules,
        trainerIds: data.selectedTrainerIds,
        myGateSocietyId: data.myGateConfig?.societyId,
        myGateApiKey: data.myGateConfig?.apiKey,
        myGateWebhookUrl: data.myGateConfig?.webhookUrl,
        displayName: data.displayName || undefined,
      }
      const res = await fetch(`/api/leads/${leadId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Submission failed")
      }
      setSubmitted(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Setup Submitted!</h2>
        <p className="text-sm text-[#6b7280] max-w-sm">
          Thank you. Our team will review your submission and send you a pricing quote shortly.
        </p>
      </div>
    )
  }

  const stepProps = { onNext: goNext, onBack: goBack, isFirst: currentStepIndex === 0 }

  function renderStep() {
    switch (currentStep.id) {
      case "gym-details":
        return (
          <StepGymDetails
            defaultValues={data.step1 ?? undefined}
            onSubmit={(values) => {
              setData((d) => ({ ...d, step1: values }))
              goNext()
            }}
            {...stepProps}
          />
        )
      case "modules":
        return (
          <StepModuleSelection
            selected={data.selectedModules}
            onChange={(mods) => setData((d) => ({ ...d, selectedModules: mods }))}
            onNext={goNext}
            onBack={goBack}
          />
        )
      case "trainer-setup":
        return (
          <StepTrainerSetup
            trainers={trainers}
            selected={data.selectedTrainerIds}
            onChange={(ids) => setData((d) => ({ ...d, selectedTrainerIds: ids }))}
            {...stepProps}
          />
        )
      case "asset-setup":
        return <StepAssetSetup {...stepProps} />
      case "mygate-config":
        return (
          <StepMyGateConfig
            defaultValues={data.myGateConfig ?? undefined}
            onSubmit={(values) => {
              setData((d) => ({ ...d, myGateConfig: values }))
              goNext()
            }}
            {...stepProps}
          />
        )
      case "vending-setup":
        return <StepVendingSetup {...stepProps} />
      case "branding-setup":
        return (
          <StepBrandingSetup
            value={data.displayName}
            onChange={(v) => setData((d) => ({ ...d, displayName: v }))}
            {...stepProps}
          />
        )
      case "review":
        return (
          <StepReview
            data={data.step1!}
            selectedModules={data.selectedModules}
            onSubmit={handleSubmit}
            onBack={goBack}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex gap-8">
      <div className="w-64 shrink-0 hidden lg:block">
        <Stepper steps={steps} currentIndex={currentStepIndex} />
      </div>
      <div className="flex-1 min-w-0">{renderStep()}</div>
    </div>
  )
}
```

> **Note:** If `StepReview`, `StepBrandingSetup`, or other step components have different prop signatures than assumed above, adjust the prop names to match the actual component definitions in `components/onboarding/`.

- [ ] **Step 2: Create `app/rwa-admin/setup/[token]/page.tsx`**

```tsx
import { prisma } from "@/lib/db/client"
import { isTokenExpired } from "@/lib/leads/token"
import { RWASetupShell } from "@/components/onboarding/RWASetupShell"
import { Building2 } from "lucide-react"

interface Props {
  params: Promise<{ token: string }>
}

export default async function RWASetupPage({ params }: Props) {
  const { token } = await params
  const lead = await prisma.lead.findUnique({ where: { inviteToken: token } })

  if (!lead) {
    return <ErrorScreen title="Invalid Link" message="This setup link is not valid." />
  }
  if (isTokenExpired(lead.inviteExpiresAt)) {
    return (
      <ErrorScreen
        title="Link Expired"
        message="This invite link has expired. Please contact your CureFit representative for a new link."
      />
    )
  }
  if (lead.status !== "INVITED") {
    return (
      <ErrorScreen
        title="Already Submitted"
        message="This setup has already been completed. Please wait for your pricing quote."
      />
    )
  }

  const trainers = await prisma.trainer.findMany({
    where: { isActive: true },
    select: { id: true, name: true, trainerType: true },
  })

  return (
    <div className="min-h-screen bg-[#0a0d14] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">OmniCore Gym Setup</h1>
            <p className="text-xs text-[#6b7280]">
              {lead.societyName} · Hi {lead.contactName}
            </p>
          </div>
        </div>
        <RWASetupShell leadId={lead.id} trainers={trainers} />
      </div>
    </div>
  )
}

function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
        <p className="text-sm text-[#6b7280]">{message}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/RWASetupShell.tsx app/rwa-admin/setup/
git commit -m "feat: RWA Admin token-gated setup wizard"
```

---

## Task 17: RWA Admin — Quote review page

**Files:**
- Create: `components/quote/QuoteSummaryCard.tsx`
- Create: `components/quote/QuoteAcceptButtons.tsx`
- Create: `app/rwa-admin/quote/[token]/page.tsx`

- [ ] **Step 1: Create `components/quote/QuoteSummaryCard.tsx`**

```tsx
import { formatPaise } from "@/lib/leads/quote"
import { computeQuoteTotals } from "@/lib/leads/quote"
import { MODULE_PRICING_LABEL } from "@/lib/constants/enums"

interface LineItem {
  id: string
  moduleKey: string
  pricingType: string
  oneTimeFee?: number | null
  monthlyFee?: number | null
  takeRatePct?: number | null
}

interface QuoteSummaryCardProps {
  notes?: string | null
  lineItems: LineItem[]
}

export function QuoteSummaryCard({ notes, lineItems }: QuoteSummaryCardProps) {
  const totals = computeQuoteTotals(lineItems)

  return (
    <div className="rounded-xl border border-[#1f2937] bg-[#111827] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1f2937]">
        <p className="text-sm font-semibold text-white">Pricing Breakdown</p>
        {notes && <p className="text-xs text-[#6b7280] mt-1">{notes}</p>}
      </div>

      <div className="divide-y divide-[#1f2937]">
        {lineItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm text-white">{item.moduleKey}</p>
              <p className="text-xs text-[#6b7280]">
                {MODULE_PRICING_LABEL[item.moduleKey as keyof typeof MODULE_PRICING_LABEL]}
              </p>
            </div>
            <div className="text-right">
              {item.oneTimeFee != null && (
                <p className="text-sm font-semibold text-[#f9fafb]">
                  {formatPaise(item.oneTimeFee)} one-time
                </p>
              )}
              {item.monthlyFee != null && (
                <p className="text-sm font-semibold text-[#f9fafb]">
                  {formatPaise(item.monthlyFee)}/mo
                </p>
              )}
              {item.takeRatePct != null && (
                <p className="text-xs text-cyan-400">{item.takeRatePct}% revenue share</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-[#374151] bg-[#0f1623] space-y-1">
        {totals.totalOneTimePaise > 0 && (
          <div className="flex justify-between">
            <span className="text-xs text-[#6b7280]">Total one-time</span>
            <span className="text-sm font-bold text-white">
              {formatPaise(totals.totalOneTimePaise)}
            </span>
          </div>
        )}
        {totals.totalMonthlyPaise > 0 && (
          <div className="flex justify-between">
            <span className="text-xs text-[#6b7280]">Total monthly</span>
            <span className="text-sm font-bold text-white">
              {formatPaise(totals.totalMonthlyPaise)}/mo
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/quote/QuoteAcceptButtons.tsx`**

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

interface QuoteAcceptButtonsProps {
  leadId: string
  onAccepted: () => void
  onRejected: () => void
}

export function QuoteAcceptButtons({ leadId, onAccepted, onRejected }: QuoteAcceptButtonsProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setIsAccepting(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/quote/accept`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to accept quote")
      }
      onAccepted()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setIsAccepting(false)
    }
  }

  async function reject() {
    setIsRejecting(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/quote/reject`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to reject quote")
      }
      onRejected()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={accept} disabled={isAccepting || isRejecting} className="flex-1">
          <CheckCircle className="w-4 h-4" />
          {isAccepting ? "Accepting…" : "Accept Quote"}
        </Button>
        <Button
          variant="outline"
          onClick={reject}
          disabled={isAccepting || isRejecting}
          className="flex-1"
        >
          <XCircle className="w-4 h-4" />
          {isRejecting ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/rwa-admin/quote/[token]/page.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { QuoteSummaryCard } from "@/components/quote/QuoteSummaryCard"
import { QuoteAcceptButtons } from "@/components/quote/QuoteAcceptButtons"
import { Building2, CheckCircle } from "lucide-react"

export default function RWAQuotePage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<"loading" | "ready" | "accepted" | "rejected" | "error">("loading")
  const [lead, setLead] = useState<{
    id: string
    societyName: string
    contactName: string
    quote: {
      notes?: string | null
      lineItems: Array<{
        id: string
        moduleKey: string
        pricingType: string
        oneTimeFee?: number | null
        monthlyFee?: number | null
        takeRatePct?: number | null
      }>
    } | null
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    // Validate token and fetch lead+quote via the leads/token endpoint
    fetch(`/api/leads/token/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json()
          // If QUOTE_SENT, the token endpoint returns 409 (already used)
          // We need to fetch the lead by token differently — use a query param approach
          // For the demo: we'll use the token directly with a special quote endpoint
          throw new Error(body.error ?? "Failed to load quote")
        }
        return res.json()
      })
      .then(({ lead }) => {
        setLead(lead)
        setState("ready")
      })
      .catch((e) => {
        // If the token is "used" (QUOTE_SENT status), load via a different path
        // For the hackathon demo, fetch the lead with the invite token via the quote API
        fetch(`/api/leads/token/${token}?forQuote=true`)
          .then((r) => r.json())
          .then(({ lead }) => {
            if (lead) {
              setLead(lead)
              setState("ready")
            } else {
              setErrorMsg(e.message)
              setState("error")
            }
          })
          .catch(() => {
            setErrorMsg(e.message)
            setState("error")
          })
      })
  }, [token])

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <p className="text-sm text-[#6b7280]">Loading quote…</p>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg font-bold text-white mb-2">Cannot load quote</p>
          <p className="text-sm text-[#6b7280]">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (state === "accepted") {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-8">
        <div className="text-center max-w-sm space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Quote Accepted!</h2>
          <p className="text-sm text-[#6b7280]">
            Your gym setup is confirmed. Our team will be in touch to complete the activation.
          </p>
        </div>
      </div>
    )
  }

  if (state === "rejected") {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-8">
        <div className="text-center max-w-sm space-y-3">
          <h2 className="text-xl font-bold text-white">Quote Rejected</h2>
          <p className="text-sm text-[#6b7280]">
            We've noted your rejection. Our team will reach out to discuss revised pricing.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Your Pricing Quote</h1>
            <p className="text-xs text-[#6b7280]">{lead?.societyName}</p>
          </div>
        </div>

        {lead?.quote ? (
          <>
            <QuoteSummaryCard notes={lead.quote.notes} lineItems={lead.quote.lineItems} />
            <QuoteAcceptButtons
              leadId={lead.id}
              onAccepted={() => setState("accepted")}
              onRejected={() => setState("rejected")}
            />
          </>
        ) : (
          <p className="text-sm text-[#6b7280]">No quote available yet.</p>
        )}
      </div>
    </div>
  )
}
```

> **Note:** The token endpoint returns 409 for `QUOTE_SENT` status. Update `app/api/leads/token/[token]/route.ts` to also accept `QUOTE_SENT` status and return the lead + quote data when `forQuote=true` query param is present. Add this to the route handler:

```typescript
// In GET handler of app/api/leads/token/[token]/route.ts, after the expiry check:
const { searchParams } = new URL(_req.url)
const forQuote = searchParams.get("forQuote") === "true"

if (lead.status === "QUOTE_SENT" && forQuote) {
  const fullLead = await prisma.lead.findUnique({
    where: { inviteToken: token },
    include: { quote: { include: { lineItems: true } } },
  })
  return NextResponse.json({ lead: fullLead })
}

if (lead.status !== "INVITED") {
  return NextResponse.json(
    { error: "This setup link has already been used" },
    { status: 409 }
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/quote/ app/rwa-admin/quote/
git commit -m "feat: RWA Admin quote review and accept/reject flow"
```

---

## Task 18: Full test run + final integration check

- [ ] **Step 1: Run all unit tests**

```bash
npm test
```

Expected: all existing tests + new equipment/quoteTotals/token tests pass.

- [ ] **Step 2: Reset DB and reseed**

```bash
npm run db:reset
```

Expected: migration runs, seed completes with 3 leads.

- [ ] **Step 3: Start dev server and verify key pages load**

```bash
npm run dev
```

Check each URL in browser:
- `http://localhost:3000/cf-admin/leads` — shows 3 seeded leads
- `http://localhost:3000/cf-admin/leads/new` — shows create form
- `http://localhost:3000/cf-admin/pricing` — shows 5 module pricing rows
- `http://localhost:3000/rwa-admin/setup/demo-token-invited-godrej-emerald-001` — shows wizard
- `http://localhost:3000/rwa-admin/quote/demo-token-quotesent-brigade-001` — shows Brigade quote

- [ ] **Step 4: Run build to check for TypeScript errors**

```bash
npm run build
```

Fix any type errors before committing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3 complete — lead funnel, pricing, RWA wizard, quote flow"
```

---

## Common Mistakes to Avoid

1. **Zod v4**: use `err.issues` not `err.errors` in catch blocks
2. **Paise arithmetic**: all money is stored as integers in paise (₹1 = 100 paise). `formatPaise()` handles display.
3. **Next.js 16 dynamic params**: always `await context.params` in route handlers and server page props
4. **SQLite transactions**: `prisma.$transaction([...])` for sequential, `prisma.$transaction(async (tx) => ...)` for interactive
5. **Lead status gate**: the `/api/leads/[id]/submit` route checks `lead.status === "INVITED"` — only the first submission is accepted
6. **Quote upsert**: creating a quote deletes existing line items and quote, then recreates — this ensures CF Admin can revise pricing freely before sending
7. **Token reuse**: once lead status moves past `INVITED`, the token endpoint returns 409. The RWA quote page handles this with `?forQuote=true` param.
