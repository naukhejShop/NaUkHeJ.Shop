import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Eye, EyeOff, KeyRound, ShoppingCart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyBox } from '@/components/key-box'
import { useShop } from '@/lib/shop-store'
import { formatDuration, formatINR, formatWhen, type Order } from '@/lib/fixtures'

export const Route = createFileRoute('/keys')({
  head: () => ({ meta: [{ title: 'My Keys · Naukhejshop.com' }] }),
  component: KeysPage,
})

function KeysPage() {
  const { orders } = useShop()
  const spent = orders.reduce((s, o) => s + o.price, 0)

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">My keys</h1>
          <p className="mt-1 text-muted-foreground">
            {orders.length} key{orders.length === 1 ? '' : 's'} purchased · {formatINR(spent)} spent
          </p>
        </div>
        <Button asChild>
          <Link to="/" hash="panels"><ShoppingCart /> Buy another key</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed p-16 text-center">
          <KeyRound className="size-10 text-muted-foreground" />
          <p className="mt-4 font-display text-xl font-semibold">No keys yet</p>
          <p className="mt-1 text-muted-foreground">Your purchased keys will show up here.</p>
          <Button asChild className="mt-6"><Link to="/">Browse panels</Link></Button>
        </div>
      ) : (
        <ul className="grid gap-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold">{order.productName}</h2>
          <Badge variant="secondary">{formatDuration(order.hours)}</Badge>
          <Badge variant="outline" className="border-success/40 text-success">Active</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatWhen(order.createdAt)} · {formatINR(order.price)} · Order {order.id.toUpperCase()}
        </p>
      </div>
      <div className="flex items-center gap-2 md:min-w-[26rem]">
        <div className="flex-1">
          {revealed ? (
            <KeyBox value={order.key} />
          ) : (
            <div className="rounded-lg border bg-secondary/50 p-3 font-mono text-lg tracking-wider text-muted-foreground">
              NKS-••••-••••-{order.key.slice(-4)}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? 'Hide key' : 'Show key'}
        >
          {revealed ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </li>
  )
}
