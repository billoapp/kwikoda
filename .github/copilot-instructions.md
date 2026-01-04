# Copilot Instructions — Tabeza

Short, actionable guidance for AI coding agents working in this repository.

## Quick summary
- Monorepo managed with pnpm + turborepo-like workspace layout. Top-level apps: `apps/customer` (port 3002) and `apps/staff` (port 3003). Use `pnpm dev` to start both in parallel.
- Built on Next.js (App Router) + TypeScript + Tailwind. Server-side features use Next server routes (app router `route.ts`).
- Primary backend is Supabase (database + storage). Supabase secrets live in environment vars (see `vercel-dashboard-checklist.md` / `vercel-env-fix.md`).

## How to run & common commands
- Start both apps locally: `pnpm dev` (top-level). Start single app: `pnpm dev:staff` or `pnpm dev:customer`.
- Build: `pnpm build` (or `pnpm build:staff` / `pnpm build:customer`).
- Lint / types: `pnpm lint`, `pnpm type-check` (top-level runs across packages).
- Clean: `pnpm clean` removes build artifacts.
- Seed demo auth: `scripts/setupDemoAuth.ts` (run with `ts-node` or compile + `node`) — uses service role key `SUPABASE_SECRET_KEY`.

## Key files / places to inspect (examples)
- Next.js apps: `apps/staff` and `apps/customer` (app directory + edge/server routes). The UI components live under `app/` and `components/`.
- Shared/small infra: `api/` (top-level API routes), `scripts/` (helper scripts), `supabase/` (migrations), `database/migrations/`.
- Supabase clients:
  - Browser/public client: `apps/staff/lib/supabase.ts` and `apps/customer/lib/supabase.ts`.
  - Server/service usage: scripts and server routes expect `SUPABASE_SECRET_KEY` (service role key).
- Example server route: `api/upload-product-image/route.ts` — demonstrates file upload handling, image processing with `sharp`, validation, and Supabase Storage upload + `getPublicUrl()`.
- Env debug helpers / docs: `vercel-dashboard-checklist.md`, `vercel-env-fix.md`, `test-debug-endpoint.js` (useful when env keys seem wrong).

## Patterns & conventions
- Feature toggles via commented blocks and boolean flags. Many interactive features are intentionally disabled — search for `/* DISABLED:` and `// DISABLED` to find candidate areas.
- Database tables used often: `bars`, `products`, `suppliers`, `categories`, `bar_products`, `custom_products`, `user_bars`, `tabs` — use these names when writing SQL or creating migrations.
- Environment variables (canonical names used across the repo):
  - Client: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Server/CI: `SUPABASE_SECRET_KEY` (service role). Do NOT leak service keys into client code.
- Image handling: server-side processing uses `sharp` (resize/auto-rotate/cover behavior). Use `800×1000` (4:5) for product images where applicable.
- Storage usage: Supabase Storage `from('<bucket>').upload(...)` then `getPublicUrl(fileName)` is the canonical pattern.

## Safety & operational notes
- Secrets must remain in environment variables. Use `vercel` dashboard checks (see `vercel-dashboard-checklist.md`) before deploying.
- To run admin-level scripts (seed users, run mass updates) you will need `SUPABASE_SECRET_KEY` and to be cautious when updating `tabs` / `bars` / `user_bars`.

## When making changes
- Prefer small, focused PRs that update one area (e.g., UI, API route, DB migration) and include a short description referencing example files (see above).
- Update or add SQL migration files under `supabase/migrations` or `database/migrations` for any schema changes.
- If adding server behavior that requires a secret, document the required env var and update `vercel-dashboard-checklist.md`.

## Useful quick references (examples)
- Upload + process image: `api/upload-product-image/route.ts` (formData → `sharp` → Supabase Storage).
- Create a demo user / link to a bar: `scripts/setupDemoAuth.ts` (uses service role key).
- Check Vercel env correctness: `test-debug-endpoint.js`, `vercel-env-fix.md`.

If you'd like, I can: add small automated checks (lint rules, env checks), expand this file with a checklist for PR reviewers, or add short code snippets for common edits. Any sections you'd like clarified or expanded?