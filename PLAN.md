# Naukhejshop.com — Product Roadmap

Naukhejshop sells time-limited panel keys. Customers top up a wallet by scanning the owner's UPI QR, choose a panel and a duration (1 hour, 3 hours, 6 hours, days…), pay from the wallet and receive a key instantly. The owner sets every price, manages stock and approves deposits.

## Milestone 1 — Product surface ✅ (done)
- Branded storefront (`/`) with panel cards, a duration picker with live prices, a buy confirmation and instant key reveal.
- Add Funds (`/wallet`): owner QR + UPI ID, quick amounts, UTR submission with validation, deposit history.
- My Keys (`/keys`): purchased keys with show/hide and copy.
- Admin (`/admin`): edit prices per duration, add/remove durations (hours or days), stock and on-sale toggle, add panels, upload payment QR / UPI ID / instructions, approve or reject deposits.
- All data is stubbed in `src/lib/fixtures.ts` and managed client-side by `src/lib/shop-store.tsx` (saved in localStorage).

## Milestone 2 — Accounts & owner login
- Netlify Identity for customer signup/login (email + Google).
- `admin` role for the owner; protect `/admin` and all admin server functions with role checks.
- Header shows the signed-in user; wallet and keys belong to that user.

## Milestone 3 — Database & real persistence
- Netlify Database (Postgres + Drizzle) tables: `products`, `durations`, `license_keys` (stock pool, single use), `wallets`, `wallet_ledger`, `fund_requests`, `orders`, `settings`.
- Replace `shop-store.tsx` actions with TanStack Start server functions; keep the same UI.
- Purchases run in one transaction: check balance → claim an unused key → debit wallet → create order.
- Unique constraint on UTR to prevent duplicate deposit claims.

## Milestone 4 — Key stock & payment QR storage
- Admin bulk-upload of real keys (paste list / CSV) per panel and duration; stock = count of unused keys.
- Store the uploaded QR image in Netlify Blobs and serve it through the Image CDN.
- Optional screenshot upload with each deposit request (Blobs).

## Milestone 5 — Operations polish
- Admin order search, user list with manual balance adjustments (ledger-backed).
- Key expiry tracking and "expires in" countdown on My Keys.
- Notifications to the owner on new deposits (email / Telegram webhook).
- Coupons / reseller pricing, Hindi language toggle.
