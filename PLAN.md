# OmniCore — Implementation Plan

> **Living document. All deviations must be approved by both developers before code is written.**
> See [Deviation Process](#deviation-process) and [Deviation Log](#deviation-log).

---

## Product Context

OmniCore is a multi-role B2B SaaS portal for managing community gym facilities in RWAs and corporate campuses. Scoped for a hackathon demo — focus on demo quality, not production completeness.

---

## Roles in Scope (Only These Two)

| Role | Access |
|---|---|
| **CF Admin** | Full read/write. Creates leads, sets pricing, approves/activates centers. Owns trainers, payroll, assets, service requests. |
| **RWA Admin** | Fills onboarding wizard via invite link, accepts pricing quote, views footfall dashboard, trainer attendance, asset status, service requests. Can create service requests. |

### Lead Funnel (approved 2026-04-09)
```
CF Admin creates Lead → invites RWA Admin (magic link, stubbed for demo)
RWA Admin fills setup wizard → CF Admin reviews + sets per-module pricing
CF Admin sends Quote → RWA Admin reviews + accepts
Center auto-creates as ONBOARDING → CF Admin activates to ACTIVE
```

**Out of scope (do not build):**
- Operator role
- Asset Manager role as standalone login
- Invoicing, GST, late fees, PDF generation
- Production authentication / real email sending
- Full external integration plumbing

---

## Tech Stack (Locked — No Changes Without Both Devs Approving)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16, App Router | Server components, clean routing, shadcn/ui compatible |
| Language | TypeScript (strict) | Type safety across DB ↔ API ↔ UI |
| Styling | Tailwind CSS v4 | Utility-first, v4 CSS-based config, co-located with components |
| UI Primitives | Radix UI (shadcn pattern) | Accessible, unstyled, composable |
| ORM | Prisma 5 (not v7) | v7 broke SQLite adapter — v5 is stable for hackathon |
| Database | SQLite (dev), Postgres-compatible schema | Zero setup locally, upgradeable |
| Analytics DB | Trino (`dataplatform-trino.curefit.co`) | Curefit data platform — AMS prod data for asset/SR/WO reports. Catalog: `delta`, schema: `pk_prod_cultsport_asset_management_service` |
| Validation | Zod | Schema-first validation, shared between API and forms |
| Testing | Vitest + React Testing Library | Fast, ESM-native, compatible with Next.js |
| E2E | Playwright (Phase 7) | Critical happy paths only |
| Fonts | DM Sans (body), DM Mono (metrics), Syne (headings) | Premium ops feel |
| Theme | Dark only | No light mode toggle needed for hackathon |

---

## Data Layer Architecture

OmniCore uses **two data sources** with a clear split of ownership:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Prisma / SQLite (local)                                            │
│  Owns: onboarding state, trainers, attendance, footfall, PT sessions│
│  Tables: Center, Trainer, CenterTrainerMapping, TrainerAttendance,  │
│          FootfallEvent, PTSession, ServiceConfig, CenterModule,     │
│          MyGateConfig, ResidentialDetails                           │
│  EquipmentAsset + ServiceRequest → seed/fallback only              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Trino (dataplatform-trino.curefit.co)                              │
│  Catalog: delta                                                     │
│  Schema:  pk_prod_cultsport_asset_management_service                │
│  Owns: real asset inventory, service requests, work orders (prod)   │
│  Used for: Phase 4 asset widget + Phase 6 asset ops + SR reports    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CultFix Portal (deep link — no API contract needed)               │
│  Used for: ticket creation / work order execution                   │
│  OmniCore passes: centerId + assetId as URL params                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Trino Query Pattern (server-side only — never client)
All Trino calls live in `lib/trino/` and are invoked only from Next.js route handlers or server components. Credentials never reach the browser.

```
lib/trino/
  client.ts          ← HTTP polling helper (POST /v1/statement → poll nextUri)
  queries/
    assets.ts        ← asset inventory + health queries per center
    serviceRequests.ts ← open/resolved SR counts, SLA breach queries
    workOrders.ts    ← WO state queries
```

### Join Key Between OmniCore and AMS
- OmniCore `Center.code` ↔ AMS `centers.externalcenterid` (verified in prod data)
- Trino queries filter by `assetownerid = :externalCenterId`

### Trino Column Reference (Verified 2026-04-09)
Columns are lowercase-flattened from MongoDB camelCase. Key columns per table:

**`assets`**: `_id`, `assetownerid`, `assetownedby`, `qrcode`, `serialnumber`, `status`, `assetownership`, `product_id`, `centerzonemapping_id`, `installationdate`, `warrantyexpirydate`, `effectivewarrantyexpirydate`, `created`, `updated`

**`service_requests`**: `_id`, `asset_id`, `assetownerid`, `state`, `priority`, `issuetype`, `servicetype`, `title`, `description`, `sla`, `source`, `created`, `updated`

**`work_orders`**: `_id`, `servicerequest_id`, `state`, `assignedvendor_id`, `assignedtechnician_id`, `workordersla`, `appointmentdate`, `created`, `updated`

**`centers`**: `_id`, `externalcenterid`, `externalcentersource`, `name`, `status`, `centertype`, `centerownershiptype`, `centercategory`, `centerpremiumness`, `oracleid`

**`qr_codes`**: `_id`, `code`, `mappedentityid`, `mappedentitytype`, `active`, `mappedat`, `mappedby`

**`products`**: `_id`, `sku`, `name`, `brand_id`, `category_id`, `productcategory_id`, `productsubcategory_id`, `productvertical_id`

**`brands`** / **`categories`** / **`product_categories`** / **`product_subcategories`** / **`product_verticals`**: `_id`, `name`

Pipeline metadata columns (ignore in queries): `op`, `kafka_ms`, `pinaka_ts_ms`, `*_pk_epoch`, `*_pk_tz`

---

## Entities (Prisma Schema — Authoritative)

```
Lead
  └── Quote
        └── QuoteLineItem[]   ← one row per selected module with pricing
  └── Center (created on quote acceptance)

Center
  ├── ResidentialDetails
  ├── MyGateConfig
  ├── CenterModule[]          ← which modules are enabled per center
  ├── ServiceConfig[]         ← pricing per service offered
  ├── EquipmentAsset[]
  ├── CenterTrainerMapping[]
  ├── TrainerAttendance[]
  ├── FootfallEvent[]
  ├── ServiceRequest[]
  └── PTSession[]

Trainer
  ├── CenterTrainerMapping[]
  ├── TrainerAttendance[]
  └── PTSession[]

ServicePricingConfig          ← CF Admin default rate card (one row per moduleKey)
EquipmentRecommendation       ← seeded lookup: SMALL | MEDIUM | LARGE → equipment list
```

**String-typed fields (SQLite has no native enums — validated via Zod + TypeScript constants in `lib/constants/enums.ts`):**

| Field | Valid values |
|---|---|
| Center.status | `ACTIVE` \| `ONBOARDING` \| `INACTIVE` |
| Lead.status | `INVITED` \| `FORM_SUBMITTED` \| `QUOTE_SENT` \| `ACCEPTED` \| `ACTIVE` \| `REJECTED` |
| Quote.status | `DRAFT` \| `SENT` \| `ACCEPTED` \| `REJECTED` |
| QuoteLineItem.pricingType | `MONTHLY` \| `ONE_TIME` \| `ONE_TIME_PLUS_TAKE_RATE` |
| ServicePricingConfig.pricingType | `MONTHLY` \| `ONE_TIME` \| `ONE_TIME_PLUS_TAKE_RATE` |
| EquipmentRecommendation.sizeCategory | `SMALL` \| `MEDIUM` \| `LARGE` |
| Trainer.trainerType | `FULLTIME` \| `PT` |
| TrainerAttendance.source | `MYGATE` \| `OTP` \| `MANUAL` |
| TrainerAttendance.status | `PRESENT` \| `ABSENT` \| `LATE` |
| EquipmentAsset.condition | `GOOD` \| `FAIR` \| `POOR` |
| ServiceRequest.status | `OPEN` \| `ASSIGNED` \| `IN_PROGRESS` \| `RESOLVED` |
| ServiceRequest.priority | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| CenterModule.moduleKey | `TRAINERS` \| `ASSETS` \| `VENDING_MACHINES` \| `BRANDING` \| `MYGATE` |

---

## Onboarding Flow (Two-Sided Lead Funnel — Approved 2026-04-09)

Onboarding is now a **two-sided lead funnel** initiated by CF Admin and completed by RWA Admin.

### Step-by-step

```
[CF Admin] /cf-admin/leads/new
  • Enter society name, RWA contact name, email, phone
  • System generates invite token (stubbed — shows copy link)

[RWA Admin] /rwa-admin/setup/[token]  ← magic link
  Step 1 — Gym & Society Details
    • Gym name, center code, sq ft, capacity
    • RWA name, total units, address, city, pincode
    • Contact person name, phone, email

  Step 2 — Select Modules
    • Module cards show payment type label only (no amounts):
      - Trainers             → "Monthly rate"
      - Asset Management     → "One-time setup"
      - Vending Machines     → "One-time installation + monthly revenue share"
      - Branding             → "One-time setup"
      - MyGate Integration   → "Monthly rate"

  Steps 3+ — Conditional on module selection
    • Trainer Setup  → map trainers (if TRAINERS selected)
    • Asset Setup    → equipment inventory stub (if ASSETS selected)
    • MyGate Config  → society ID, API key (if MYGATE selected)
    • Vending Setup  → machine locations (if VENDING_MACHINES selected)
    • Branding       → display name (if BRANDING selected)

  Final Step — Review & Confirm
    • Submits formData as JSON to Lead record (no Center created yet)

[CF Admin] /cf-admin/leads/[id]
  • Reviews submitted form data
  • Sees equipment recommendation panel (SMALL/MEDIUM/LARGE based on sq ft + units)

[CF Admin] /cf-admin/leads/[id]/quote
  • Sets pricing per selected module (pre-filled from ServicePricingConfig defaults)
  • Module pricing types:
      TRAINERS          → monthly fee (₹/month)
      ASSETS            → one-time fee (₹)
      VENDING_MACHINES  → one-time install fee (₹) + take rate (%)
      MYGATE            → monthly fee (₹/month)
      BRANDING          → one-time fee (₹)
  • Sends quote → Lead.status → QUOTE_SENT

[RWA Admin] /rwa-admin/quote/[token]
  • Sees quote breakdown with line items and totals
  • Accepts → Center auto-created as ONBOARDING, Lead.status → ACCEPTED
  • Rejects → Lead.status → REJECTED (CF Admin renegotiates)

[CF Admin] /cf-admin/onboarding
  • Center appears in onboarding list → CF Admin flips to ACTIVE
```

### Equipment Recommendation Logic

Computed from submitted `gymSqFt` and `totalUnits`:
```
SMALL  → gymSqFt < 1000  OR  totalUnits < 200
MEDIUM → gymSqFt 1000–2500  OR  totalUnits 200–500
LARGE  → gymSqFt > 2500  OR  totalUnits > 500
```
Seeded in `EquipmentRecommendation`. Informational only — shown to CF Admin to inform pricing.

---

## Asset Status Rules (Business Logic — Locked)

For Prisma-seeded assets (fallback/demo):
```
nextServiceDue > 30 days away  →  GREEN  (condition: GOOD)
nextServiceDue 7–30 days away  →  AMBER  (condition: FAIR)
nextServiceDue < 7 days or overdue  →  RED  (condition: POOR)
```
Implemented in: `lib/constants/enums.ts → computeAssetStatus()`

For Trino (real AMS data), the `assets.status` field from AMS is the source of truth. OmniCore maps AMS `AssetStatus` values to GREEN/AMBER/RED in `lib/trino/queries/assets.ts`.

---

## Service Request Workflow

### In OmniCore (demo / Prisma fallback)
```
OPEN → ASSIGNED → IN_PROGRESS → RESOLVED
```
- CF Admin can move between any status
- RWA Admin can only create (OPEN) and view

### In AMS / CultFix (real production flow)
```
ServiceRequest.state:  OPEN → ASSIGNED → IN_PROGRESS → RESOLVED (+ terminal states)
WorkOrder.state:       CREATED → ACCEPTED → STARTED → COMPLETED / CANCELLED
```
- OmniCore shows SR/WO state read-only from Trino
- Ticket creation → deep link to CultFix portal with `centerId` + `assetId` pre-filled
- OTP verification, vendor assignment, cost requests all happen in CultFix/AMS

---

## Phases & Status

| Phase | Description | Data Source | Status |
|---|---|---|---|
| **0** | Foundation: scaffold, Prisma schema, seed, Vitest, app shell, role switcher | Prisma | ✅ Done |
| **1** | Shared components: StatCard, StatusBadge, DataTable, Timeline, Stepper | — | ✅ Done |
| **2** | Onboarding wizard (RWA-facing): dynamic multi-step with module selection + payment type labels | Prisma | ✅ Done |
| **3** | Lead funnel + pricing: CF Admin lead pipeline, RWA invite flow, quote builder, RWA quote acceptance | Prisma | 🔄 In Progress |
| **4** | RWA Admin dashboard: footfall, attendance, asset widget, open SR count | Prisma (footfall/attendance) + Trino (assets/SRs) | ⬜ Pending |
| **5** | Trainer operations: roster, attendance table, PT payroll preview, CSV export | Prisma | ⬜ Pending |
| **6** | Asset operations: inventory from Trino, SR/WO history, CultFix deep link | Trino (primary) + Prisma seed (fallback) | ⬜ Pending |
| **7** | MyGate stubs + live footfall SSE stream simulation | Prisma | ⬜ Pending |

---

## Folder Structure (Authoritative)

```
/app
  /cf-admin/
    layout.tsx              ← CF Admin shell (sidebar + main)
    page.tsx                ← CF Admin landing / overview
    /leads/
      page.tsx              ← Lead pipeline (kanban or table view)
      /new/
        page.tsx            ← Create lead + generate invite link
      /[id]/
        page.tsx            ← Lead detail + equipment recommendation panel
        /quote/
          page.tsx          ← Quote builder (set pricing per module)
    /pricing/
      page.tsx              ← ServicePricingConfig rate card editor
    /onboarding/
      page.tsx              ← Centers in ONBOARDING status + activate CTA
    /trainers/
    /assets/
    /service-requests/
    /payroll/
  /rwa-admin/
    layout.tsx              ← RWA Admin shell
    page.tsx                ← RWA Admin dashboard
    /setup/
      /[token]/
        page.tsx            ← Onboarding wizard (magic link entry)
    /quote/
      /[token]/
        page.tsx            ← Quote review + accept/reject
    /attendance/
    /assets/
    /service-requests/
  /api/
    /leads/
      route.ts              ← POST create lead
      /[id]/
        /quote/
          route.ts          ← POST send quote
    /rwa/
      /setup/
        /[token]/
          route.ts          ← GET validate token, POST submit form
      /quote/
        /[token]/
          route.ts          ← GET fetch quote, POST accept/reject
    /pricing/
      route.ts              ← GET/POST ServicePricingConfig
    /onboarding/
      route.ts              ← POST create center (from accepted quote)
    /footfall/
      /stream/route.ts      ← SSE endpoint (Phase 7)
    /webhooks/
      /mygate/route.ts      ← MyGate webhook stub (Phase 7)

/components
  /ui/                      ← Radix-based primitives (Button, Badge, Card, etc.)
  /shared/
    Sidebar.tsx
    StatCard.tsx
    StatusBadge.tsx
    DataTable.tsx
    Timeline.tsx
    Stepper.tsx
  /leads/                   ← CF Admin lead management components
    LeadPipelineTable.tsx
    LeadDetailPanel.tsx
    EquipmentRecommendationPanel.tsx
    QuoteBuilder.tsx
    QuoteLineItem.tsx
  /onboarding/              ← RWA Admin wizard (moved to /rwa-admin/setup/[token])
    OnboardingShell.tsx
    ModuleSelector.tsx
    FormField.tsx
    StepGymDetails.tsx
    StepModuleSelection.tsx
    StepTrainerSetup.tsx
    StepAssetSetup.tsx
    StepMyGateConfig.tsx
    StepVendingSetup.tsx
    StepBrandingSetup.tsx
    StepReview.tsx
  /quote/                   ← RWA Admin quote review
    QuoteReviewCard.tsx
    QuoteAcceptDialog.tsx
  /dashboard/               ← RWA Admin dashboard widgets
    FootfallCard.tsx
    LiveFeed.tsx
    UtilizationWidget.tsx
    PeakHeatmap.tsx
    AssetHealthWidget.tsx   ← Trino-powered asset count by status (Phase 4)
    OpenTicketsWidget.tsx   ← Trino-powered open SR count + SLA breaches (Phase 4)

/lib
  /constants/
    navigation.ts           ← Nav items per role
    enums.ts                ← Domain enums + business logic functions
  /validations/             ← Zod schemas per entity
    center.ts
    lead.ts
    quote.ts
    pricing.ts
  /onboarding/
    steps.ts                ← deriveOnboardingSteps() — conditional step logic
    equipment.ts            ← deriveEquipmentCategory() — SMALL/MEDIUM/LARGE logic
  /db/
    client.ts               ← Prisma singleton
  /trino/
    client.ts               ← Trino HTTP polling client (server-only)
    queries/
      assets.ts             ← Asset inventory + health queries
      serviceRequests.ts    ← SR counts, SLA breach, state breakdown
      workOrders.ts         ← WO state + vendor queries

/prisma
  schema.prisma             ← Source of truth for data model
  seed.ts                   ← Demo data (includes ServicePricingConfig defaults + EquipmentRecommendation)

/tests
  /unit/                    ← Vitest unit tests
  /e2e/                     ← Playwright E2E (Phase 7)

/docs
  /superpowers/
    /specs/                 ← Feature design specs
      2026-04-09-lead-funnel-pricing-design.md
```

---

## Seed Data Provided

| Entity | Count | Source | Notes |
|---|---|---|---|
| Centers | 3 | Prisma seed | 2 ACTIVE (with MyGate), 1 ONBOARDING (no MyGate) |
| Trainers | 5 | Prisma seed | 3 FULLTIME, 2 PT |
| Leads | 3 | Prisma seed | 1 INVITED, 1 QUOTE_SENT, 1 ACCEPTED |
| ServicePricingConfig | 5 | Prisma seed | One default rate per module (TRAINERS, ASSETS, VENDING_MACHINES, BRANDING, MYGATE) |
| EquipmentRecommendation | 3 | Prisma seed | SMALL / MEDIUM / LARGE category lists |
| Assets | 8 | Prisma seed | **Fallback only** — real data comes from Trino. 1 RED, 1 AMBER, rest GREEN |
| Service Requests | 4 | Prisma seed | **Fallback only** — real data comes from Trino |
| Footfall Events | 33 | Prisma seed | Simulated last 24h for Prestige + Brigade |
| PT Sessions | 42 | Prisma seed | Last 30 days across Prestige + Brigade |
| Trainer Attendance | 21 records | Prisma seed | Last 7 days, 1 absent trainer seeded |
| Asset inventory (real) | Live | Trino | `delta.pk_prod_cultsport_asset_management_service.assets` filtered by `assetownerid` |
| Service Requests (real) | Live | Trino | `service_requests` + `work_orders` + `service_request_state_transitions` |

---

## Key Decisions Made (Both Devs Must Read)

| # | Decision | Rationale | Date |
|---|---|---|---|
| 1 | Downgraded Prisma v7 → v5 | v7 broke SQLite with new adapter requirement; v5 is stable | 2026-04-09 |
| 2 | No native enums in schema | SQLite in Prisma 5 doesn't support enums; using String fields + TypeScript constants | 2026-04-09 |
| 3 | URL-based role routing | `/cf-admin/*` and `/rwa-admin/*` — clean separation, back-button works, easy to test | 2026-04-09 |
| 4 | No auth middleware | Role is determined purely by URL prefix for hackathon; real auth comes later | 2026-04-09 |
| 5 | Dynamic onboarding steps | Steps 3+ conditional on module selection in Step 2 — avoids showing irrelevant forms | 2026-04-09 |
| 6 | CenterModule model added | Tracks which modules (Trainers, Assets, MyGate, etc.) are enabled per center | 2026-04-09 |
| 7 | Trino for asset/SR reports | Real prod data in `delta.pk_prod_cultsport_asset_management_service` (verified 2026-04-09). Auth: Basic `fitness-analysts`. Prisma seed is fallback only for offline/demo | 2026-04-09 |
| 8 | CultFix deep link for ticket creation | CultFix owns the QR→SR→WO workflow. OmniCore links out with centerId+assetId. Avoids rebuilding ticket logic. | 2026-04-09 |
| 9 | Prisma EquipmentAsset + ServiceRequest are demo-only | Real asset + SR data lives in AMS/Trino. Prisma tables kept for seeded demo fallback when Trino is unavailable. | 2026-04-09 |
| 10 | Trino column names are lowercase-flattened | MongoDB camelCase → all lowercase in datalake (e.g. `assetownerid`, `qrcode`, `serialnumber`). No underscores between words. | 2026-04-09 |
| 11 | Two-sided onboarding: RWA Admin fills wizard, CF Admin prices and approves | RWA Admin knows their gym best. CF Admin owns commercial decisions. Matches real-world B2B sales flow. | 2026-04-09 |
| 12 | Lead funnel introduced (Lead, Quote, QuoteLineItem models) | Enables end-to-end demo story: invite → wizard → pricing → quote → acceptance → center creation | 2026-04-09 |
| 13 | Module pricing types: MONTHLY, ONE_TIME, ONE_TIME_PLUS_TAKE_RATE | Different commercial models per module. Trainers/MyGate = subscription. Assets/Branding = one-off. Vending = install fee + revenue share. | 2026-04-09 |
| 14 | Equipment recommendations via seeded lookup (not AI/dynamic) | Hackathon scope — lookup by SMALL/MEDIUM/LARGE category sufficient to demo value. Dynamic AI-driven recommendations deferred. | 2026-04-09 |
| 15 | RWA Admin wizard moved from `/cf-admin/onboarding/new` → `/rwa-admin/setup/[token]` | CF Admin should not be filling in RWA-specific data. Token-gated page allows RWA Admin to self-serve after invite. | 2026-04-09 |
| 16 | Module cards show payment type label only (no amounts) in wizard | RWA Admin sees pricing category for context; actual numbers visible only in CF-generated quote | 2026-04-09 |

---

## Deviation Process

> A **deviation** is any change to:
> - Folder structure defined above
> - Entity names or relationships in the Prisma schema
> - Tech stack choices
> - Phase scope or sequencing
> - Business rules (asset status thresholds, service request workflow, role permissions)

### Process
1. Developer proposing a deviation writes it in the **Deviation Log** below (draft status)
2. Other developer reviews and either approves or requests changes
3. Only after both mark `APPROVED` does code get written
4. The relevant section of PLAN.md is updated to reflect the approved change

### How to record a deviation
Add an entry to the Deviation Log table below.

---

## Deviation Log

| # | Date | Proposed By | Change Description | Status | Dev 1 | Dev 2 |
|---|---|---|---|---|---|---|
| 1 | 2026-04-09 | mkn | **Tech stack addition: Trino** — Add `dataplatform-trino.curefit.co` as analytics data source for Phases 4 + 6. Catalog `delta`, schema `pk_prod_cultsport_asset_management_service`. Credentials in `.env`. `lib/trino/` added to folder structure. | APPROVED | ✅ | ✅ |
| 2 | 2026-04-09 | mkn | **Phase 6 data source change** — Asset inventory + service request reports pulled from Trino instead of OmniCore's own Prisma tables. Prisma `EquipmentAsset` + `ServiceRequest` become seed-only fallback. | APPROVED | ✅ | ✅ |
| 3 | 2026-04-09 | mkn | **CultFix deep link for ticket creation** — "Raise ticket" in Phase 6 opens CultFix portal with `centerId` + `assetId` pre-filled via URL params instead of creating a ServiceRequest in OmniCore's DB. SR creation is out of scope for OmniCore. | APPROVED | ✅ | ✅ |
| 4 | 2026-04-09 | mkn | **Phase 3 redesigned: Lead funnel + pricing replaces CF Admin overview** — Introduces Lead, Quote, QuoteLineItem, ServicePricingConfig, EquipmentRecommendation models. Adds new pages for lead pipeline, quote builder, and RWA-facing wizard + quote acceptance. Spec in `docs/superpowers/specs/2026-04-09-lead-funnel-pricing-design.md`. | APPROVED | ✅ | ✅ |
| 5 | 2026-04-09 | mkn | **Onboarding wizard moved to RWA Admin** — `/cf-admin/onboarding/new` retired; wizard now lives at `/rwa-admin/setup/[token]`. CF Admin flow becomes: create lead → review submission → set pricing → send quote. Center is created only after RWA Admin accepts the quote. | APPROVED | ✅ | ✅ |
| 7 | 2026-04-09 | shivalingesh | **New Prisma model: EquipmentCatalogItem** — Master catalog of Cultsport commercial equipment (from Commercial Catalog 2025 PDF). 50+ items, 12 categories, with imageUrl refs to 24 AI-generated images in `public/equipment/`. Branch: `shiv/equipment-catalog`. | APPROVED | ✅ | ✅ |
| 8 | 2026-04-09 | shivalingesh | **Quote.quoteMode + Quote.totalAmount** — CF Admin can price as ITEMIZED (per-module line items) or TOTAL (single agreed amount, individual prices hidden from RWA quote). | APPROVED | ✅ | ✅ |
| 9 | 2026-04-09 | shivalingesh | **New wizard field gymSetupType (NEW_GYM / EXISTING_GYM)** — Mandatory dropdown added to Set-up-your-gym Step 1. NEW_GYM → StepEquipmentSelection (full Cultsport catalog filtered by tier, model gym pre-selected). EXISTING_GYM → StepServicesNeeded (upgrade highlights). deriveOnboardingSteps() updated to accept gymSetupType param. | APPROVED | ✅ | ✅ |
| 10 | 2026-04-09 | shivalingesh | **Pre-filled demo defaults** — RWASetupShell uses DEMO_DEFAULTS (all fields pre-filled), selectedModules defaults to TRAINERS+ASSETS+MYGATE, model gym equipment pre-selected by tier. Demo URL: http://localhost:3000/rwa/setup/DEMO-TOKEN-2026 | APPROVED | ✅ | ✅ |

---

## Test Coverage Requirements

| Area | Minimum | Tool |
|---|---|---|
| Business logic (asset status, payroll calc, equipment category) | 100% | Vitest |
| Form validation (Zod schemas — lead, quote, pricing, center) | All schemas | Vitest |
| Sidebar nav per role | All nav items | Vitest + RTL |
| Onboarding step progression (all conditional paths) | All paths | Vitest + RTL |
| Lead funnel state transitions | All valid + invalid transitions | Vitest |
| Quote line item pricing type rendering | All three types | Vitest + RTL |
| ModuleSelector payment type labels | All 5 modules | Vitest + RTL |
| Equipment recommendation logic (SMALL/MEDIUM/LARGE boundaries) | All boundaries | Vitest |
| CF Admin lead pipeline → quote → accept E2E | Happy path | Playwright |
| RWA Admin wizard + quote acceptance E2E | Happy path | Playwright |

---

## Demo Script (Hackathon)

### Act 1 — Lead Funnel (CF Admin → RWA Admin → CF Admin → RWA Admin)
1. Open as **CF Admin** → Lead Pipeline shows 3 seeded leads in different states
2. Click "New Lead" → enter RWA contact → system generates invite link (shown as copy/stub)
3. Open invite link → switches to **RWA Admin** setup wizard
4. Fill wizard: gym details → select modules (module cards show payment type labels)
5. Conditional steps appear based on module selection → complete and submit
6. Back to **CF Admin** → lead moves to FORM_SUBMITTED, equipment recommendation panel visible
7. Click "Build Quote" → pre-filled rate card, adjust per-module pricing, send quote
8. Back to **RWA Admin** → `/rwa-admin/quote/[token]` shows line-item breakdown
9. RWA Admin accepts → center auto-created, lead = ACCEPTED
10. CF Admin activates center → status flips ONBOARDING → ACTIVE

### Act 2 — Operations Dashboard (RWA Admin)
11. Switch to **RWA Admin** dashboard — footfall card, trainer attendance, asset widget
12. Show **asset health widget** — real asset counts from Trino (GREEN/AMBER/RED)
13. Show open ticket count + SLA breaches

### Act 3 — CF Admin Operations
14. Switch to **CF Admin** → asset inventory (real data from Trino, filtered by center)
15. Click "Raise Ticket" on a RED asset → deep link opens CultFix with centerId + assetId pre-filled
16. Show PT payroll preview for a trainer
17. Show service request history table (Trino) with state transitions timeline

---

## Running Locally

```bash
# Install
npm install

# Database setup (first time)
npx prisma migrate dev

# Seed demo data
npm run db:seed

# Dev server
npm run dev

# Tests
npm test

# Reset + reseed
npm run db:reset
```

### Environment Variables Required

Copy `.env.example` → `.env` and fill in:

```bash
# Prisma / SQLite
DATABASE_URL="file:./prisma/dev.db"

# Trino — Curefit data platform (asset/SR/WO reports)
TRINO_HOST="dataplatform-trino.curefit.co"
TRINO_USER="fitness-analysts"
TRINO_PASSWORD="<see team vault>"
TRINO_CATALOG="delta"
TRINO_SCHEMA="pk_prod_cultsport_asset_management_service"
```

> Trino is optional for local dev — if `TRINO_PASSWORD` is not set, Phase 4 + 6 components fall back to Prisma seed data automatically.

---

*Last updated: 2026-04-09 by mkn — Phase 3 redesigned as lead funnel + pricing; RWA Admin wizard + quote acceptance added; new Prisma models (Lead, Quote, QuoteLineItem, ServicePricingConfig, EquipmentRecommendation); folder structure, roles, demo script, test requirements all updated. See deviations #4 and #5.*
