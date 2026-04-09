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
| **CF Admin** | Full read/write. Owns onboarding, trainers, payroll, assets, service requests, pricing. |
| **RWA Admin** | Mostly read-only. Sees footfall dashboard, trainer attendance, asset status, service requests. Can create requests. |

**Out of scope (do not build):**
- Operator role
- Asset Manager role as standalone login
- Invoicing, GST, late fees, PDF generation
- Production authentication
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
```

**String-typed fields (SQLite has no native enums — validated via Zod + TypeScript constants in `lib/constants/enums.ts`):**

| Field | Valid values |
|---|---|
| Center.status | `ACTIVE` \| `ONBOARDING` \| `INACTIVE` |
| Trainer.trainerType | `FULLTIME` \| `PT` |
| TrainerAttendance.source | `MYGATE` \| `OTP` \| `MANUAL` |
| TrainerAttendance.status | `PRESENT` \| `ABSENT` \| `LATE` |
| EquipmentAsset.condition | `GOOD` \| `FAIR` \| `POOR` |
| ServiceRequest.status | `OPEN` \| `ASSIGNED` \| `IN_PROGRESS` \| `RESOLVED` |
| ServiceRequest.priority | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| CenterModule.moduleKey | `TRAINERS` \| `ASSETS` \| `VENDING_MACHINES` \| `BRANDING` \| `MYGATE` |

---

## Onboarding Flow (Multi-Step — Conditional)

The onboarding is a **dynamic multi-step flow** where later steps depend on which modules are selected in Step 2.

```
Step 1 — Gym & Society Details
  • Gym/center name
  • Society/RWA name
  • Sq ft of gym
  • Total residential units
  • Address, City, Pincode
  • Contact person name, phone, email

Step 2 — Select Modules (checkboxes)
  • Trainers               → enables Steps 3a
  • Asset Management       → enables Step 3b
  • Vending Machines       → enables Step 3c
  • Branding               → enables Step 3d
  • MyGate Integration     → enables Step 3e (footfall + trainer attendance)

Steps 3a–3e — Conditional (only shown if module was selected in Step 2)
  3a. Trainer Setup        → map initial trainers, set schedules
  3b. Asset Setup          → tag initial equipment inventory
  3c. Vending Machines     → machine IDs, locations
  3d. Branding             → logo, display name, colors
  3e. MyGate Config        → society ID, API key, webhook URL

Final Step — Review & Confirm
  • Summary of all entered data
  • Submit saves center as ONBOARDING status
  • CF Admin can return and complete remaining steps later
```

**Key rule:** Draft saving at every step. Center is created in `ONBOARDING` status. Steps can be completed out of order or resumed later.

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
| **1** | Shared components: StatCard, StatusBadge, DataTable, Timeline, Stepper | — | 🔄 In Progress |
| **2** | Onboarding flow: dynamic multi-step with module selection | Prisma | ⬜ Pending |
| **3** | CF Admin overview: center grid, detail view, quick actions | Prisma | ⬜ Pending |
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
    /onboarding/
      page.tsx              ← Onboarding entry (center list + new center CTA)
      /[centerId]/
        page.tsx            ← Dynamic step form for a center
    /trainers/
    /assets/
    /service-requests/
    /payroll/
  /rwa-admin/
    layout.tsx              ← RWA Admin shell
    page.tsx                ← RWA Admin dashboard
    /attendance/
    /assets/
    /service-requests/
  /api/
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
  /onboarding/
    OnboardingShell.tsx     ← Stepper wrapper
    StepGymDetails.tsx
    StepModuleSelection.tsx
    StepTrainerSetup.tsx
    StepAssetSetup.tsx
    StepMyGateConfig.tsx
    StepReview.tsx
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
  /validations/             ← Zod schemas per entity (Phase 2+)
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
  seed.ts                   ← Demo data

/tests
  /unit/                    ← Vitest unit tests
  /e2e/                     ← Playwright E2E (Phase 7)
```

---

## Seed Data Provided

| Entity | Count | Source | Notes |
|---|---|---|---|
| Centers | 3 | Prisma seed | 2 ACTIVE (with MyGate), 1 ONBOARDING (no MyGate) |
| Trainers | 5 | Prisma seed | 3 FULLTIME, 2 PT |
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

---

## Test Coverage Requirements

| Area | Minimum | Tool |
|---|---|---|
| Business logic (asset status, payroll calc) | 100% | Vitest |
| Form validation (Zod schemas) | All schemas | Vitest |
| Sidebar nav per role | All nav items | Vitest + RTL |
| Onboarding step progression | All paths | Vitest + RTL |
| CF Admin vs RWA Admin route access | Happy path | Playwright |
| Onboarding end-to-end | Happy path | Playwright |

---

## Demo Script (Hackathon)

1. Open as **CF Admin**
2. Show center grid (3 centers, different statuses)
3. Start new center onboarding → select modules → conditional steps appear
4. Switch to **RWA Admin** (one click) — layout shifts, menu collapses, READ ONLY badge appears
5. Show live footfall dashboard with check-in feed
6. Show **asset health widget** — real asset counts from Trino (GREEN/AMBER/RED), open ticket count + SLA breaches
7. Switch back to **CF Admin** → show asset inventory (real data from Trino, filtered by center)
8. Click "Raise Ticket" on a RED asset → deep link opens CultFix with centerId + assetId pre-filled
9. Show PT payroll preview for a trainer
10. Show service request history table (Trino) with state transitions timeline

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

*Last updated: 2026-04-09 by mkn + shivalingesh (Trino integration + architecture update)*
