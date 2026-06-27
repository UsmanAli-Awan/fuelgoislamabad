# FuelGo Islamabad

A production-ready fuel delivery web platform for Islamabad, Pakistan. Customers order petrol, diesel, or hi-octane from nearby registered petrol pumps — fuel delivered to their doorstep.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/fuelgo run dev` — run the frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + TailwindCSS + shadcn/ui + wouter + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), stored in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle table definitions (users, pumps, fuel_prices, orders, reviews, favorites)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.0 spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (auth, customers, pumps, fuel, orders, reviews, admin)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware + role guards
- `artifacts/fuelgo/src/pages/` — All React pages (customer/, pump/, admin/, landing.tsx)
- `artifacts/fuelgo/src/lib/auth.tsx` — AuthContext + AuthProvider
- `artifacts/fuelgo/src/components/layout.tsx` — Shared header/nav layout

## Architecture decisions

- JWT stored in localStorage ("fuelgo_token"), Bearer token on all API calls
- Admin login uses email+password (phone field is 03009999999); customers/pump owners use phone+password with role field
- Pump owners start with status "pending" — must be approved by admin before dashboard is accessible (redirected to /pump/pending)
- Order status flow: pending → accepted/rejected → preparing → out_for_delivery → delivered; customer can cancel only when pending
- DB schema uses numeric/text columns for decimals (Drizzle pg-core) — always parseFloat on read
- setAuthTokenGetter is imported from main `@workspace/api-client-react` package (not the sub-path `/custom-fetch`)

## Product

- **Landing Page**: Role selection (Customer / Pump Owner) with Login/Register CTAs
- **Customer**: Browse approved pumps, view fuel prices, place fuel orders, track order status, favorite pumps, manage profile
- **Pump Owner**: Register pump (admin approval required), manage dashboard, accept/prepare/deliver orders, set fuel prices & availability, edit station profile
- **Admin**: Dashboard with platform stats, approve/reject pump registrations, manage users (suspend/activate), view all orders

## Demo Credentials

| Role | Phone/Email | Password |
|------|-------------|----------|
| Customer | 03003333333 | customer123 |
| Customer | 03004444444 | customer123 |
| Pump Owner | 03001111111 | owner123 |
| Pump Owner | 03002222222 | owner123 |
| Admin | admin@fuelgo.pk (email login) | admin123 |

## User preferences

- Full web stack only (React + Vite + Express + PostgreSQL) — no Flutter, no Laravel
- Pakistan context: PKR currency, Pakistani phone numbers (11 digits, 03xxx format)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml
- Always run `pnpm --filter @workspace/db run push` after changing DB schema
- The `@workspace/api-client-react` barrel (index.ts) re-exports setAuthTokenGetter — don't import from the /custom-fetch sub-path
- Pump owner dashboard is gated: if status !== "approved", redirect to /pump/pending

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
