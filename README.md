# OmniCore — Community Gym Facility Management

A multi-role B2B SaaS portal for managing community gym facilities inside RWAs and corporate campuses. Built for hackathon demo quality.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | `24.2.0` (pinned in `.nvmrc`) | [nodejs.org](https://nodejs.org) or `nvm install` |
| **npm** | `11.x` (ships with Node 24) | bundled |
| **Git** | any recent | [git-scm.com](https://git-scm.com) |

> Using **nvm**? Run `nvm use` in the project root — it reads `.nvmrc` automatically.

---

## First-Time Setup

```bash
# 1. Clone
git clone https://github.com/curefit/omnicore.git
cd omnicore

# 2. Switch to correct Node version (if using nvm)
nvm use

# 3. Install all dependencies (also runs prisma generate via postinstall)
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env if needed — the default SQLite config works out of the box

# 5. Create the database and run all migrations
npx prisma migrate dev

# 6. Seed demo data (centers, leads, bookings, trainers, assets)
npm run db:seed

# 7. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Dependencies

All dependencies are declared in `package.json` and locked in `package-lock.json`. Running `npm install` installs the exact versions.

### Runtime dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.3 | Framework (App Router) |
| `react` / `react-dom` | 19.2.4 | UI runtime |
| `typescript` | ^5 | Type safety |
| `tailwindcss` | ^4 | Utility-first CSS |
| `prisma` + `@prisma/client` | ^5.22.0 | ORM + SQLite/Postgres |
| `zod` | ^4.3.6 | Schema validation (API + forms) |
| `react-hook-form` | ^7.72.1 | Form state management |
| `@hookform/resolvers` | ^5.2.2 | Zod adapter for react-hook-form |
| `lucide-react` | ^1.7.0 | Icon set |
| `@radix-ui/*` | various | Accessible UI primitives |
| `clsx` + `tailwind-merge` | latest | Class name utilities |
| `next-themes` | ^0.4.6 | Dark/light mode |
| `class-variance-authority` | ^0.7.1 | Component variant styling |

### Dev dependencies

| Package | Version | Purpose |
|---|---|---|
| `vitest` | ^4.1.3 | Unit test runner |
| `@testing-library/react` | ^16.3.2 | Component testing |
| `@testing-library/jest-dom` | ^6.9.1 | DOM matchers |
| `@testing-library/user-event` | ^14.6.1 | User interaction simulation |
| `@vitejs/plugin-react` | ^6.0.1 | React transform for Vitest |
| `jsdom` | ^29.0.2 | DOM environment for tests |
| `tsx` | ^4.21.0 | Run TypeScript scripts (seed) |
| `eslint` + `eslint-config-next` | ^9 / 16.2.3 | Linting |
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS plugin |

---

## npm Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at `localhost:3000` with hot reload |
| `npm run build` | Production build (runs type checks) |
| `npm start` | Serve the production build |
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply pending Prisma migrations |
| `npm run db:seed` | Seed demo data (safe to re-run — clears + reseeds) |
| `npm run db:reset` | Drop + recreate DB + re-seed (destructive) |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) at `localhost:5555` |

---

## Environment Variables

Copy `.env.example` to `.env`. The defaults work for local development.

```bash
# SQLite — works out of the box, no setup needed
DATABASE_URL="file:./dev.db"

# Trino (optional — for live asset/SR reports from Curefit data platform)
# Falls back to seeded demo data if not set
TRINO_HOST="dataplatform-trino.curefit.co"
TRINO_USER="fitness-analysts"
TRINO_PASSWORD="<see team vault>"
TRINO_CATALOG="delta"
TRINO_SCHEMA="pk_prod_cultsport_asset_management_service"
```

---

## Key URLs (after `npm run dev`)

### CF Admin Portal

| URL | Purpose |
|---|---|
| `localhost:3000/cf-admin` | Overview dashboard |
| `localhost:3000/cf-admin/leads` | Lead pipeline |
| `localhost:3000/cf-admin/leads/new` | Create lead + generate invite |
| `localhost:3000/cf-admin/leads/[id]` | Review submission + equipment recommendation |
| `localhost:3000/cf-admin/leads/[id]/quote` | Build + send pricing quote |
| `localhost:3000/cf-admin/pricing` | Default rate card per module |
| `localhost:3000/cf-admin/onboarding` | Active + onboarding centers |

### RWA Admin Portal

| URL | Purpose |
|---|---|
| `localhost:3000/rwa-admin/join` | Token gate — paste invite link or token |
| `localhost:3000/rwa/setup/[token]` | Onboarding wizard (gym details + module selection) |
| `localhost:3000/rwa/quote/[token]` | Quote review — accept or reject |
| `localhost:3000/rwa-admin` | Live dashboard (footfall, trainer attendance, bookings) |

### Demo Tokens (seeded)

| Token | Status | Redirects to |
|---|---|---|
| `demo-token-invited-godrej-emerald-001` | `INVITED` | Setup wizard |
| `demo-token-submitted-sobha-001` | `FORM_SUBMITTED` | Error (already submitted) |
| `demo-token-quotesent-brigade-001` | `QUOTE_SENT` | Quote review |

---

## Database

The project uses **SQLite** for local development (file: `prisma/dev.db`). The schema is Postgres-compatible — switching is a one-line change in `.env`.

```bash
# View current DB in a GUI
npm run db:studio

# Reset everything (drops + recreates + reseeds)
npm run db:reset

# After pulling schema changes from another developer
npm run db:migrate
npm run db:seed   # if seed data changed
npx prisma generate   # if schema models changed (regenerates client)
```

---

## Lead Funnel Flow

```
1. CF Admin creates Lead  →  /cf-admin/leads/new
2. System generates invite token  →  shared with RWA Admin
3. RWA Admin enters token  →  /rwa-admin/join
4. RWA Admin completes wizard  →  /rwa/setup/[token]
5. CF Admin reviews submission  →  /cf-admin/leads/[id]
6. CF Admin builds + sends quote  →  /cf-admin/leads/[id]/quote
7. RWA Admin reviews + accepts  →  /rwa/quote/[token]
8. Center auto-created in DB  →  status: ONBOARDING
9. CF Admin activates  →  status: ACTIVE
10. RWA Admin views dashboard  →  /rwa-admin
```

---

## Roles

| Role | URL Prefix | Who |
|---|---|---|
| **CF Admin** | `/cf-admin/*` | CultSport ops / relationship managers |
| **RWA Admin** | `/rwa-admin/*` and `/rwa/*` | Society / RWA representative |

---

## Documentation

- [`PLAN.md`](./PLAN.md) — Full implementation plan, phase tracker, deviation approval process
- [`docs/superpowers/specs/`](./docs/superpowers/specs/) — Design specs per feature

---

## Troubleshooting

**`prisma.amenityBooking is not a function` or similar**
```bash
npx prisma generate   # regenerate client after schema changes
# then restart npm run dev
```

**Port 3000 already in use**
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

**Migrations out of sync (another dev added a migration)**
```bash
git pull
npm run db:migrate
```

**Seed fails with unique constraint errors**
```bash
npm run db:reset   # drops + recreates + reseeds cleanly
```
