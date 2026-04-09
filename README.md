# OmniCore — Community Gym Facility Management

A multi-role B2B SaaS portal for managing community gym facilities inside RWAs and corporate campuses. Built for hackathon demo quality.

## Roles

| Role | Access |
|---|---|
| **CF Admin** | Manages leads, pricing, onboarding approval, trainers, assets, payroll, service requests |
| **RWA Admin** | Fills onboarding wizard, accepts pricing quote, views footfall dashboard, trainer attendance, asset status, creates service requests |

## Lead Funnel Flow

```
CF Admin creates Lead → invites RWA Admin (magic link)
RWA Admin fills setup wizard → CF Admin reviews + sets pricing
CF Admin sends Quote → RWA Admin accepts
Center auto-creates → CF Admin activates
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI (shadcn pattern) |
| ORM | Prisma 5 + SQLite (dev) |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| Analytics | Trino (`dataplatform-trino.curefit.co`) |

## Getting Started

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
```

## Environment Variables

Copy `.env.example` → `.env`:

```bash
DATABASE_URL="file:./prisma/dev.db"

# Optional — Trino for real asset/SR data (falls back to seed if not set)
TRINO_HOST="dataplatform-trino.curefit.co"
TRINO_USER="fitness-analysts"
TRINO_PASSWORD="<see team vault>"
TRINO_CATALOG="delta"
TRINO_SCHEMA="pk_prod_cultsport_asset_management_service"
```

## Key URLs

| Role | Path | Purpose |
|---|---|---|
| CF Admin | `/cf-admin/leads` | Lead pipeline |
| CF Admin | `/cf-admin/leads/new` | Create lead + invite |
| CF Admin | `/cf-admin/leads/[id]` | Review submission + equipment recommendation |
| CF Admin | `/cf-admin/leads/[id]/quote` | Set pricing + send quote |
| CF Admin | `/cf-admin/pricing` | Default rate card |
| CF Admin | `/cf-admin/onboarding` | Active + onboarding centers |
| RWA Admin | `/rwa-admin/setup/[token]` | Onboarding wizard (magic link) |
| RWA Admin | `/rwa-admin/quote/[token]` | Quote review + accept/reject |
| RWA Admin | `/rwa-admin` | Dashboard |

## Documentation

- [`PLAN.md`](./PLAN.md) — Full implementation plan, phase tracker, deviation process
- [`docs/superpowers/specs/`](./docs/superpowers/specs/) — Design specs per feature
