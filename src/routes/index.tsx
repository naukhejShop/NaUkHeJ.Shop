import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  KeyRound,
  QrCode,
  ShoppingCart,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { KeyBox } from '@/components/key-box'
import { useShop } from '@/lib/shop-store'
import {
  formatDuration,
  formatINR,
  type Order,
  type Product,
} from '@/lib/fixtures'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { products } = useShop()
  const visible = products.filter((p) => p.active)
  const lowestPrice = Math.min(
    ...visible.flatMap((p) => p.durations.map((d) => d.price)),
  )

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-content gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Badge variant="outline" className="mb-5 gap-1.5 border-primary/40 px-3 py-1 text-primary">
              <Zap className="size-3.5" /> Instant key delivery · 24×7
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Panel keys,{' '}
              <span className="text-primary">ready in seconds.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Pick your panel, choose 1 hour, 3 hours, 6 hours or longer, and pay
              from your wallet. Top up with any UPI app by scanning our QR.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="glow-primary">
                <a href="#panels">
                  <ShoppingCart /> Browse panels
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/wallet">
                  <QrCode /> Add funds
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ['From', Number.isFinite(lowestPrice) ? formatINR(lowestPrice) : '—'],
                ['Panels', String(visible.length)],
                ['Delivery', '< 5 sec'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="font-display text-2xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ol className="grid gap-3">
            {[
              { icon: QrCode, title: 'Add funds', body: 'Scan the QR, pay with any UPI app and submit your UTR.' },
              { icon: Clock, title: 'Choose a duration', body: '1 hour to 30 days — pay only for the time you need.' },
              { icon: KeyRound, title: 'Get your key', body: 'Your key appears instantly and stays saved in My Keys.' },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-xl border bg-card/80 p-5 backdrop-blur">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <step.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
                  <h2 className="font-display text-lg font-semibold">{step.title}</h2>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="panels" className="mx-auto max-w-content scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold">Choose your panel</h2>
            <p className="mt-1 text-muted-foreground">Select a duration — price updates instantly.</p>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="size-4 text-success" /> Every key is single-use and verified
          </p>
        </div>
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No panels are on sale right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { balance, buy } = useShop()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(product.durations[0]?.id)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)

  const selected =
    product.durations.find((d) => d.id === selectedId) ?? product.durations[0]
  const outOfStock = product.stock <= 0
  const shortBy = selected ? selected.price - balance : 0

  function handleBuy() {
    if (!selected) return
    const result = buy(product.id, selected.id)
    setConfirmOpen(false)
    if (result.ok) {
      setOrder(result.order)
      toast.success('Key delivered!', { description: `${product.name} · ${formatDuration(selected.hours)}` })
    } else if (result.reason === 'balance') {
      toast.error('Not enough balance', {
        description: 'Add funds to your wallet to continue.',
        action: { label: 'Add funds', onClick: () => navigate({ to: '/wallet' }) },
      })
    } else if (result.reason === 'stock') {
      toast.error('Out of stock', { description: 'This panel is sold out right now.' })
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40 motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            {product.badge && <Badge>{product.badge}</Badge>}
          </div>
          <h3 className="font-display text-2xl font-bold">{product.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
            outOfStock
              ? 'bg-destructive/15 text-destructive'
              : product.stock < 15
                ? 'bg-primary/15 text-primary'
                : 'bg-success/15 text-success',
          )}
        >
          {outOfStock ? 'Sold out' : `${product.stock} in stock`}
        </span>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {product.features.map((f) => (
          <li key={f} className="flex items-center gap-1.5">
            <Check className="size-3.5 text-success" /> {f}
          </li>
        ))}
      </ul>

      <fieldset className="mt-6">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Duration
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {product.durations.map((d) => {
            const active = d.id === selected?.id
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-left transition-colors motion-reduce:transition-none',
                  active
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'hover:border-muted-foreground/50',
                )}
              >
                <span className="block text-sm font-medium">{formatDuration(d.hours)}</span>
                <span className={cn('font-display text-lg font-bold', active && 'text-primary')}>
                  {formatINR(d.price)}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-3xl font-bold">{selected ? formatINR(selected.price) : '—'}</p>
        </div>
        <Button
          size="lg"
          disabled={outOfStock || !selected}
          onClick={() => setConfirmOpen(true)}
        >
          {outOfStock ? 'Sold out' : <>Buy key <ArrowRight /></>}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Confirm purchase</DialogTitle>
            <DialogDescription>
              {product.name} · {selected && formatDuration(selected.hours)}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid gap-2 rounded-lg border bg-secondary/40 p-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Price</dt><dd className="font-semibold">{selected && formatINR(selected.price)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Wallet balance</dt><dd className="font-semibold">{formatINR(balance)}</dd></div>
            <div className="flex justify-between border-t pt-2">
              <dt className="text-muted-foreground">After purchase</dt>
              <dd className={cn('font-semibold', shortBy > 0 && 'text-destructive')}>
                {shortBy > 0 ? `Short by ${formatINR(shortBy)}` : formatINR(balance - (selected?.price ?? 0))}
              </dd>
            </div>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            {shortBy > 0 ? (
              <Button asChild>
                <Link to="/wallet"><QrCode /> Add {formatINR(shortBy)}</Link>
              </Button>
            ) : (
              <Button onClick={handleBuy}><ShoppingCart /> Pay {selected && formatINR(selected.price)}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={order !== null} onOpenChange={(o) => !o && setOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Your key is ready 🎉</DialogTitle>
            <DialogDescription>
              {order?.productName} · valid for {order && formatDuration(order.hours)} from first login.
            </DialogDescription>
          </DialogHeader>
          {order && <KeyBox value={order.key} />}
          <DialogFooter>
            <Button variant="outline" asChild>
              <Link to="/keys">View all my keys</Link>
            </Button>
            <Button onClick={() => setOrder(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}
