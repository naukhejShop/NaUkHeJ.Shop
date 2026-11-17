# Naukhejshop.com

An online shop for selling time-based panel keys. Customers add money to a wallet by scanning the owner's UPI QR code, pick a panel and a duration — 1 hour, 3 hours, 6 hours, 1 day or anything the owner sets — and get their key instantly. The owner controls every price, duration, stock level and the payment QR from the admin panel.

## Screens
- **Shop** (`/`) — hero, how-it-works, panel cards with duration/price picker and instant key delivery.
- **Add Funds** (`/wallet`) — owner's QR and UPI ID, amount + UTR submission, deposit history.
- **My Keys** (`/keys`) — purchased keys with reveal and copy.
- **Admin** (`/admin`) — pricing & durations, stock, payment QR upload, deposit approvals.

> The current version runs on preview data stored in your browser. Accounts, a shared database and real key stock are on the roadmap in [PLAN.md](PLAN.md).

## Tech
TanStack Start (React 19, TanStack Router), Vite, Tailwind CSS 4, shadcn/ui components, lucide icons, sonner toasts. Deployed on Netlify.

## Run locally
```bash
pnpm install
netlify dev   # or: pnpm dev
```

## Roadmap
1. ✅ Product surface (this version)
2. Customer accounts and owner-only admin (Netlify Identity)
3. Netlify Database for wallets, deposits, orders and keys
4. Bulk key upload and QR image storage (Netlify Blobs)
5. Notifications, expiry tracking, coupons

See [PLAN.md](PLAN.md) for details.
