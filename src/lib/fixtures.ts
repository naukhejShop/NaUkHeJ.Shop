/**
 * Stubbed shop data for Naukhejshop.
 *
 * Everything the UI shows comes from here (via `shop-store.tsx`). A later
 * milestone replaces these fixtures with Netlify Database tables; keep the
 * shapes in sync with `db/schema.ts` when that lands.
 */

export type Duration = {
  id: string
  /** Validity in hours. 1, 3, 6, 12, 24, 168 … */
  hours: number
  /** Price in INR (₹). Set freely by the owner in the admin panel. */
  price: number
}

export type Product = {
  id: string
  name: string
  tagline: string
  category: string
  badge?: string
  /** Number of unused keys available for sale. */
  stock: number
  active: boolean
  features: string[]
  durations: Duration[]
}

export type FundStatus = 'pending' | 'approved' | 'rejected'

export type FundRequest = {
  id: string
  user: string
  amount: number
  /** UPI transaction reference (UTR) the customer typed after paying. */
  utr: string
  status: FundStatus
  createdAt: string
}

export type Order = {
  id: string
  productId: string
  productName: string
  hours: number
  price: number
  key: string
  createdAt: string
}

export type PaymentSettings = {
  payeeName: string
  upiId: string
  /** Data URL / image URL of the owner's payment QR. `null` shows a placeholder. */
  qrImage: string | null
  minDeposit: number
  note: string
}

export type ShopData = {
  currentUser: string
  balance: number
  products: Product[]
  fundRequests: FundRequest[]
  orders: Order[]
  payment: PaymentSettings
}

// Fixed reference time keeps server and browser renders identical.
const now = Date.parse('2026-11-10T12:00:00Z')
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString()

export const initialShopData: ShopData = {
  currentUser: 'player_rahul',
  balance: 450,
  products: [
    {
      id: 'pro-panel',
      name: 'Naukhej Pro Panel',
      tagline: 'Our best-selling panel with every feature unlocked.',
      category: 'Android',
      badge: 'Best seller',
      stock: 48,
      active: true,
      features: ['All features unlocked', 'Anti-ban updates', 'Instant delivery'],
      durations: [
        { id: 'pro-1h', hours: 1, price: 29 },
        { id: 'pro-3h', hours: 3, price: 69 },
        { id: 'pro-6h', hours: 6, price: 119 },
        { id: 'pro-24h', hours: 24, price: 249 },
        { id: 'pro-7d', hours: 168, price: 899 },
      ],
    },
    {
      id: 'lite-panel',
      name: 'Naukhej Lite Panel',
      tagline: 'Lightweight and smooth on low-end devices.',
      category: 'Android',
      stock: 120,
      active: true,
      features: ['Low RAM friendly', 'Simple menu', 'Instant delivery'],
      durations: [
        { id: 'lite-1h', hours: 1, price: 15 },
        { id: 'lite-3h', hours: 3, price: 39 },
        { id: 'lite-6h', hours: 6, price: 69 },
        { id: 'lite-24h', hours: 24, price: 149 },
      ],
    },
    {
      id: 'vip-panel',
      name: 'VIP Panel',
      tagline: 'Priority support and early access to new builds.',
      category: 'Android + iOS',
      badge: 'VIP',
      stock: 12,
      active: true,
      features: ['Priority support', 'Early access builds', 'Device reset included'],
      durations: [
        { id: 'vip-3h', hours: 3, price: 99 },
        { id: 'vip-6h', hours: 6, price: 179 },
        { id: 'vip-24h', hours: 24, price: 399 },
        { id: 'vip-30d', hours: 720, price: 2499 },
      ],
    },
    {
      id: 'pc-panel',
      name: 'PC Emulator Panel',
      tagline: 'Built for emulator players on Windows.',
      category: 'PC',
      stock: 0,
      active: true,
      features: ['Emulator support', 'Hotkey menu', 'Instant delivery'],
      durations: [
        { id: 'pc-1h', hours: 1, price: 35 },
        { id: 'pc-6h', hours: 6, price: 149 },
        { id: 'pc-24h', hours: 24, price: 299 },
      ],
    },
  ],
  fundRequests: [
    {
      id: 'fr-1004',
      user: 'player_rahul',
      amount: 200,
      utr: '432918756120',
      status: 'pending',
      createdAt: ago(12),
    },
    {
      id: 'fr-1003',
      user: 'ff_king07',
      amount: 500,
      utr: '432911002345',
      status: 'pending',
      createdAt: ago(35),
    },
    {
      id: 'fr-1002',
      user: 'player_rahul',
      amount: 500,
      utr: '431877650091',
      status: 'approved',
      createdAt: ago(60 * 26),
    },
    {
      id: 'fr-1001',
      user: 'sniper_ash',
      amount: 100,
      utr: '431800000000',
      status: 'rejected',
      createdAt: ago(60 * 50),
    },
  ],
  orders: [
    {
      id: 'ord-2001',
      productId: 'lite-panel',
      productName: 'Naukhej Lite Panel',
      hours: 1,
      price: 15,
      key: 'NKS-7QF2-L9XA-83KD',
      createdAt: ago(60 * 20),
    },
  ],
  payment: {
    payeeName: 'Naukhej Alam',
    upiId: 'naukhejshop@upi',
    qrImage: null,
    minDeposit: 50,
    note: 'Pay the exact amount, then paste the 12-digit UTR number. Funds are added after verification (usually within 10 minutes).',
  },
}

export function formatDuration(hours: number) {
  if (hours < 24) return `${hours} Hour${hours === 1 ? '' : 's'}`
  const days = hours / 24
  if (Number.isInteger(days)) return `${days} Day${days === 1 ? '' : 's'}`
  return `${hours} Hours`
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}
