import { getStoredSession } from '@/lib/auth'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

type Row = Record<string, unknown>

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase environment variables are missing.')
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY }
}

function headers(extra: Record<string, string> = {}) {
  const { key } = config()
  const session = getStoredSession()
  return { apikey: key, ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...extra }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: headers({ 'Content-Type': 'application/json', ...((init.headers ?? {}) as Record<string, string>) }),
  })
  const body = await response.text()
  if (!response.ok) {
    let message = body || 'Supabase request failed.'
    try {
      const parsed = JSON.parse(body) as { message?: string; details?: string; hint?: string }
      message = parsed.message || parsed.details || message
    } catch { /* keep raw response */ }
    throw new Error(message)
  }
  return (body ? JSON.parse(body) : null) as T
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  return request<T>(`rpc/${name}`, { method: 'POST', body: JSON.stringify(args) })
}

export type ShopDuration = {
  id: number
  product_id: number
  duration_name: string
  duration_value: number
  duration_unit: string
  price_paise: number
  is_active: boolean
}

export type ShopProduct = {
  id: number
  name: string
  description: string | null
  price: number
  category: string | null
  image_url: string | null
  video_url: string | null
  product_type: string | null
  stock: number
  is_active: boolean
  durations: ShopDuration[]
}

export type DepositRow = {
  id: number
  user_id: string
  amount_paise: number
  utr_number: string
  payment_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export async function loadProducts(): Promise<ShopProduct[]> {
  return rpc<ShopProduct[]>('get_shop_products', {})
}

export async function loadMyWallet(): Promise<number> {
  const session = getStoredSession()
  if (!session?.user?.id) throw new Error('Please login first.')
  const rows = await request<Array<{ wallet_balance_paise: number }>>(
    `customer_profiles?select=wallet_balance_paise&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    { method: 'GET' },
  )
  if (!rows.length) throw new Error('Wallet profile not found.')
  return Number(rows[0].wallet_balance_paise) / 100
}

export async function loadMyDeposits(): Promise<DepositRow[]> {
  const session = getStoredSession()
  if (!session?.user?.id) throw new Error('Please login first.')
  return request<DepositRow[]>(
    `deposit_requests?select=id,user_id,amount_paise,utr_number,payment_status,created_at&user_id=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc`,
    { method: 'GET' },
  )
}

export async function submitDeposit(amountRupees: number, utr: string) {
  const session = getStoredSession()
  if (!session?.user?.id) throw new Error('Please login first.')
  await request<null>('deposit_requests', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: session.user.id,
      amount_paise: Math.round(amountRupees * 100),
      utr_number: utr,
      payment_status: 'pending',
    }),
  })
}

export async function saveProduct(input: {
  id?: number
  name: string
  description: string
  priceRupees: number
  category: string
  imageUrl: string
  videoUrl: string
  productType: string
}): Promise<number> {
  return rpc<number>('admin_save_product', {
    p_id: input.id ?? null,
    p_name: input.name,
    p_description: input.description,
    p_price: input.priceRupees,
    p_category: input.category,
    p_image_url: input.imageUrl || null,
    p_video_url: input.videoUrl || null,
    p_product_type: input.productType,
  })
}

export async function addDuration(input: {
  productId: number
  name: string
  value: number
  unit: string
  priceRupees: number
}): Promise<number> {
  return rpc<number>('add_product_duration', {
    p_product_id: input.productId,
    p_duration_name: input.name,
    p_duration_value: input.value,
    p_duration_unit: input.unit,
    p_price_paise: Math.round(input.priceRupees * 100),
  })
}

export async function uploadKeys(durationId: number, keys: string[]): Promise<number> {
  return rpc<number>('add_inventory_keys', {
    p_duration_id: durationId,
    p_keys: keys,
  })
}

export async function approveDeposit(id: number): Promise<string> {
  return rpc<string>('approve_deposit', { p_deposit_id: id })
}

export async function rejectDeposit(id: number): Promise<string> {
  return rpc<string>('reject_deposit', { p_deposit_id: id })
}

export async function loadCustomers() {
  return rpc<Array<{
    user_id: string
    email: string
    wallet_balance_paise: number
    created_at: string
  }>>('admin_get_customers', {})
}

export async function purchaseKey(input: {
  durationId: number
  customerName: string
  phone: string
  address: string
}) {
  const rows = await rpc<Array<{
    order_id: number
    delivered_key: string
    remaining_balance_paise: number
  }>>('purchase_shop_key', {
    p_duration_id: input.durationId,
    p_customer_name: input.customerName,
    p_phone: input.phone,
    p_address: input.address,
  })
  if (!rows?.length) throw new Error('Purchase did not return a key.')
  return rows[0]
}

export type TopBuyer = {
  buyer_name: string
  purchase_count: number
  total_spent: number
}

export async function loadTopBuyers(): Promise<TopBuyer[]> {
  return rpc<TopBuyer[]>('get_top_buyers', {})
}
