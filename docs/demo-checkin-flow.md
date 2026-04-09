# Demo: MyGate proxy → QR → kiosk check-in

This flow exercises the demo API that simulates an external booking system posting to CureFit, returning a QR payload for the resident, and verifying it at a kiosk.

| Piece | URL / path |
|-------|------------|
| Browser demo | `/demo/checkin-flow` |
| Create booking (proxy) | `POST /api/demo/mygate-proxy/booking` |
| List seeded centers (same DB as the server) | `GET /api/demo/centers` |
| Kiosk verify | `POST /api/kiosk/verify-checkin` |

## Prerequisites

- Node.js and dependencies installed (`npm install`).
- `DATABASE_URL` in `.env` (see `.env.example`). Local dev uses SQLite.

### Where the SQLite file lives

For `DATABASE_URL="file:./dev.db"`, Prisma resolves the path **relative to the `prisma/` directory** (where `schema.prisma` lives). So the file on disk is:

```text
prisma/dev.db
```

not `dev.db` at the repository root. Use the same `DATABASE_URL` for `npm run dev`, `npm run db:studio`, and any `sqlite3` commands you run by hand.

## Regenerate demo data (fresh centers and ids)

Seeded `Center` rows get **new cuids** every time you seed. If you use an old `centerId` from a previous run, another machine, or a screenshot, the booking API returns **Unknown centerId**.

From the repo root:

1. **Apply migrations** (if you have not already):

   ```bash
   npm run db:migrate
   ```

   In CI or production-like environments without interactive migrate:

   ```bash
   npm run db:deploy
   ```

2. **Load or refresh seed data**:

   ```bash
   npm run db:seed
   ```

   To wipe the database, re-run migrations from scratch, and seed in one step:

   ```bash
   npm run db:reset
   ```

3. **Confirm centers** (optional):

   ```bash
   sqlite3 prisma/dev.db "SELECT id, name, code FROM Center;"
   ```

   Or open Prisma Studio with the same `DATABASE_URL` as the app:

   ```bash
   npm run db:studio
   ```

4. **Run the app** and open the demo page:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000/demo/checkin-flow](http://localhost:3000/demo/checkin-flow).

The page loads **`GET /api/demo/centers`** and fills a **dropdown** with centers from the database the server is actually using—use that selection (or the API response) so `centerId` always matches the current seed.

## Optional: proxy secret

If `DEMO_MYGATE_PROXY_SECRET` is set in `.env`, the booking route requires header `x-demo-secret` with that value. The demo page has an optional field for it.

## Docker demo stack

If you run the app with Docker (see [demo-docker.md](./demo-docker.md)), use the same seed commands **inside** the web container (e.g. `npm run demo:docker:seed`) so the container’s database matches what you use in the UI.

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| `Unknown centerId` | Re-run `db:seed` and use a current id from `/api/demo/centers`, the demo dropdown, or `Center` in Studio—not a stale id. |
| `no such table: Center` | Migrations not applied to the DB file you are querying; run `db:migrate` / `db:deploy` against the same `DATABASE_URL`. |
| Studio vs app disagree | Ensure Studio uses the same `DATABASE_URL` as `npm run dev` (same `prisma/dev.db` for the default URL). |
