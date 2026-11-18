import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { loadMyWallet, loadProducts, purchaseKey } from '@/lib/supabase-shop'
import { getStoredSession } from '@/lib/auth'

import {
  initialShopData,
  type Duration,
  type PaymentSettings,
  type Product,
  type ShopData,
  type Order,
} from '@/lib/fixtures'

/**
 * Client-side shop state for the preview milestone.
 *
 * State starts from `fixtures.ts` and is mirrored to localStorage so the demo
 * survives a refresh. A later milestone swaps these actions for server
 * functions backed by Netlify Database (see PLAN.md).
 */

const STORAGE_KEY = 'naukhejshop:preview:v1'

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`

const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateKey() {
  const block = () =>
    Array.from(
      { length: 4 },
      () => KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)],
    ).join('')
  return `NKS-${block()}-${block()}-${block()}`
}

type BuyResult =
  | { ok: true; order: Order }
  | { ok: false; reason: 'balance' | 'stock' | 'missing' }

type ShopContextValue = ShopData & {
  buy: (productId: string, durationId: string) => Promise<BuyResult>
  requestFunds: (amount: number, utr: string) => void
  reviewFundRequest: (id: string, approve: boolean) => void
  updateDuration: (productId: string, duration: Duration) => void
  addDuration: (productId: string, hours: number, price: number) => void
  removeDuration: (productId: string, durationId: string) => void
  updateProduct: (productId: string, patch: Partial<Product>) => void
  addProduct: (name: string, category: string) => void
  updatePayment: (patch: Partial<PaymentSettings>) => void
  resetDemo: () => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ShopData>(initialShopData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setData(JSON.parse(saved) as ShopData)
    } catch {
      // ignore corrupt storage and keep fixtures
    }
    setHydrated(true)

    const syncAccount = () => {
      const session = getStoredSession()
      if (!session?.user?.id) {
        setData((current) => ({ ...current, balance: 0, currentUser: 'Guest', orders: [], fundRequests: [] }))
        return
      }
      setData((current) => ({ ...current, currentUser: session.user.email || 'Customer', orders: [], fundRequests: [] }))
      loadMyWallet().then((balance) => setData((current) => ({ ...current, balance }))).catch(() => {
        setData((current) => ({ ...current, balance: 0 }))
      })
    }
    syncAccount()
    window.addEventListener('naukhej-auth-change', syncAccount)

    let active = true
    loadProducts()
      .then((rows) => {
        if (!active) return
        setData((current) => ({
          ...current,
          products: rows.map((row) => ({
            id: String(row.id),
            name: row.name,
            tagline: row.description || '',
            category: row.category || 'Other',
            stock: Number(row.stock || 0),
            active: row.is_active,
            features: [],
            durations: row.durations.map((duration) => ({
              id: String(duration.id),
              hours: duration.duration_value * (duration.duration_unit === 'days' ? 24 : 1),
              price: Number(duration.price_paise) / 100,
            })),
          })),
        }))
      })
      .catch(() => {
        if (active) setData((current) => ({ ...current, products: [] }))
      })
    return () => {
      active = false
      window.removeEventListener('naukhej-auth-change', syncAccount)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage full (e.g. large QR image) — keep working in memory
    }
  }, [data, hydrated])

  const buy = useCallback(
    async (productId: string, durationId: string): Promise<BuyResult> => {
      const product = data.products.find((p) => p.id === productId)
      const duration = product?.durations.find((d) => d.id === durationId)
      const session = getStoredSession()
      if (!session?.user?.id) return { ok: false, reason: 'missing' }
      if (!product || !duration) return { ok: false, reason: 'missing' }
      if (product.stock <= 0) return { ok: false, reason: 'stock' }
      try {
        const result = await purchaseKey({
          durationId: Number(durationId),
          customerName: session.user.email || 'Customer',
          phone: '',
          address: '',
        })
        const [balance, products] = await Promise.all([loadMyWallet(), loadProducts()])
        const order: Order = {
          id: String(result.order_id),
          productId,
          productName: product.name,
          hours: duration.hours,
          price: duration.price,
          key: result.delivered_key,
          createdAt: new Date().toISOString(),
        }
        setData((current) => ({
          ...current,
          balance,
          orders: [order, ...current.orders],
          products: products.map((row) => ({
            id: String(row.id),
            name: row.name,
            tagline: row.description || '',
            category: row.category || 'Other',
            stock: Number(row.stock || 0),
            active: row.is_active,
            features: [],
            durations: row.durations.map((item) => ({
              id: String(item.id),
              hours: item.duration_value * (item.duration_unit === 'days' ? 24 : 1),
              price: Number(item.price_paise) / 100,
            })),
          })),
        }))
        return { ok: true, order }
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (message.includes('balance') || message.includes('insufficient')) return { ok: false, reason: 'balance' }
        if (message.includes('stock') || message.includes('available key')) return { ok: false, reason: 'stock' }
        throw error
      }
    },
    [data.products],
  )

  const value = useMemo<ShopContextValue>(
    () => ({
      ...data,
      buy,
      requestFunds: (amount, utr) =>
        setData((d) => ({
          ...d,
          fundRequests: [
            {
              id: uid('fr'),
              user: d.currentUser,
              amount,
              utr,
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
            ...d.fundRequests,
          ],
        })),
      reviewFundRequest: (id, approve) =>
        setData((d) => {
          const req = d.fundRequests.find((r) => r.id === id)
          if (!req || req.status !== 'pending') return d
          return {
            ...d,
            // Only the demo customer has a visible wallet in the preview.
            balance:
              approve && req.user === d.currentUser
                ? d.balance + req.amount
                : d.balance,
            fundRequests: d.fundRequests.map((r) =>
              r.id === id
                ? { ...r, status: approve ? 'approved' : 'rejected' }
                : r,
            ),
          }
        }),
      updateDuration: (productId, duration) =>
        setData((d) => ({
          ...d,
          products: d.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  durations: p.durations.map((x) =>
                    x.id === duration.id ? duration : x,
                  ),
                }
              : p,
          ),
        })),
      addDuration: (productId, hours, price) =>
        setData((d) => ({
          ...d,
          products: d.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  durations: [
                    ...p.durations,
                    { id: uid('dur'), hours, price },
                  ].sort((a, b) => a.hours - b.hours),
                }
              : p,
          ),
        })),
      removeDuration: (productId, durationId) =>
        setData((d) => ({
          ...d,
          products: d.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  durations: p.durations.filter((x) => x.id !== durationId),
                }
              : p,
          ),
        })),
      updateProduct: (productId, patch) =>
        setData((d) => ({
          ...d,
          products: d.products.map((p) =>
            p.id === productId ? { ...p, ...patch } : p,
          ),
        })),
      addProduct: (name, category) =>
        setData((d) => ({
          ...d,
          products: [
            ...d.products,
            {
              id: uid('prd'),
              name,
              category,
              tagline: 'New panel — edit the description in a later update.',
              stock: 0,
              active: true,
              features: ['Instant delivery'],
              durations: [
                { id: uid('dur'), hours: 1, price: 25 },
                { id: uid('dur'), hours: 3, price: 59 },
                { id: uid('dur'), hours: 6, price: 99 },
              ],
            },
          ],
        })),
      updatePayment: (patch) =>
        setData((d) => ({ ...d, payment: { ...d.payment, ...patch } })),
      resetDemo: () => setData(initialShopData),
    }),
    [data, buy],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used inside <ShopProvider>')
  return ctx
}
