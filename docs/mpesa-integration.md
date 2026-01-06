# M-Pesa Integration (STK using existing Till/Paybill)

Overview
- Goal: Accept M-Pesa STK payments where payments go directly into each venue's existing Till/Paybill; Tabeza orchestrates STK and records ledger entries in `tab_payments`.

Quick requirements
- Bars must set `payment_mpesa_enabled = true` and provide `mpesa_till_number` or `mpesa_paybill_number` (via Staff Settings in the app).
- Required environment variables (server only):
  - `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` (Daraja credentials)
  - `MPESA_PASSKEY` (global passkey fallback; per-bar passkeys are recommended for security)
  - `MPESA_CALLBACK_URL` (public callback URL, e.g. `https://api.tabeza.com/api/payments/mpesa/callback`)
  - `MPESA_BASE_URL` (optional, defaults to Daraja sandbox)

Implemented endpoints
- POST `/api/payments/mpesa/stk-push` — server endpoint that:
  1. Validates `tabId`, `amount`, `phone`.
  2. Verifies the tab and bar; ensures `payment_mpesa_enabled`.
  3. Creates a `tab_payments` row with `status = 'pending'` and `reference` (encoded bar+tab).
  4. Calls Daraja STK push and stores the STK request details in `metadata`.
  5. If STK request fails synchronously, sets `status = 'failed'` and returns 502.

- POST `/api/payments/mpesa/callback` — Daraja callback handler that:
  1. Parses callback JSON (handles typical Daraja `stkCallback` shape).
  2. Extracts `AccountReference` and finds the latest `tab_payments` row with that reference.
  3. If found and `status = 'pending'`, set `status = 'success'` when `ResultCode === 0` else `failed` and append `mpesa_result` to `metadata`.
  4. Returns HTTP 200 for Daraja.

Notes & next steps
- Passkeys: we now support **per-bar** `mpesa_passkey` stored on each `bars` row (recommended). The server will prefer `bars.mpesa_passkey` when present and fall back to a global `MPESA_PASSKEY` only if a bar passkey is not set.
- Security: ensure the Daraja callback URL is registered for the Daraja app. Use service role `SUPABASE_SECRET_KEY` in server routes for DB writes.
- RLS: `tab_payments` RLS uses `app.current_bar_id` in this repo; server routes use the service key and not limited by RLS.
- Tests: included small scripts to simulate a callback (`scripts/send-mpesa-callback.ps1`). Add unit/integration tests next.

Operational checklist
- [ ] Confirm bars have correct shortcodes and accept STK pushes from Tabeza's Daraja app.
- [ ] Set production Daraja credentials and `MPESA_CALLBACK_URL`.
- [ ] Consider adding `mpesa_passkey` to `bars` for per-venue passkeys.
- [ ] Add tests and CI checks (unit + callback integration).

If you'd like, I can now:
- Add per-bar `mpesa_passkey` column and migration (recommended), and
- Add unit/integration tests that mock Daraja responses and confirm ledger updates (PR).
