import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Check,
  Clock,
  IndianRupee,
  Package,
  Plus,
  QrCode,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QrPlaceholder } from '@/components/site-shell'
import { StatusBadge } from '@/components/status-badge'
import { useShop } from '@/lib/shop-store'
import { formatDuration, formatINR, formatWhen, type Product } from '@/lib/fixtures'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Admin · Naukhejshop.com' }] }),
  component: AdminPage,
})

function AdminPage() {
  const { products, fundRequests, orders, resetDemo, addProduct } = useShop()
  const pending = fundRequests.filter((r) => r.status === 'pending')
  const revenue = orders.reduce((s, o) => s + o.price, 0)
  const [newName, setNewName] = useState('')

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Admin panel</h1>
          <p className="mt-1 text-muted-foreground">Set prices, durations, your payment QR and approve deposits.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetDemo()
            toast('Preview data reset')
          }}
        >
          <RotateCcw /> Reset preview data
        </Button>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">Preview mode.</span> Changes here are saved in this browser only.
          Owner login and a shared database are next on the roadmap.
        </p>
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Package, label: 'Panels', value: String(products.length) },
          { icon: Clock, label: 'Pending deposits', value: String(pending.length) },
          { icon: IndianRupee, label: 'Key sales', value: formatINR(revenue) },
          { icon: QrCode, label: 'Keys in stock', value: String(products.reduce((s, p) => s + p.stock, 0)) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><s.icon className="size-3.5" /> {s.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <Tabs defaultValue="pricing">
        <TabsList className="mb-6">
          <TabsTrigger value="pricing">Panels & pricing</TabsTrigger>
          <TabsTrigger value="payment">Payment QR</TabsTrigger>
          <TabsTrigger value="deposits">
            Deposits {pending.length > 0 && <Badge className="ml-1.5 h-5 px-1.5">{pending.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="grid gap-6">
          {products.map((p) => (
            <ProductEditor key={p.id} product={p} />
          ))}
          <form
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed p-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newName.trim()) return
              addProduct(newName.trim(), 'Android')
              setNewName('')
              toast.success('Panel added with 1h / 3h / 6h prices')
            }}
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="new-panel">Add a new panel</Label>
              <Input id="new-panel" placeholder="Panel name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <Button type="submit"><Plus /> Add panel</Button>
          </form>
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettingsForm />
        </TabsContent>

        <TabsContent value="deposits">
          <DepositsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductEditor({ product }: { product: Product }) {
  const { updateDuration, removeDuration, addDuration, updateProduct } = useShop()
  const [amount, setAmount] = useState('12')
  const [unit, setUnit] = useState<'hours' | 'days'>('hours')
  const [price, setPrice] = useState('')

  function add(e: React.FormEvent) {
    e.preventDefault()
    const hours = Number(amount) * (unit === 'days' ? 24 : 1)
    const value = Number(price)
    if (!hours || hours <= 0) return toast.error('Enter a valid duration')
    if (!Number.isFinite(value) || value <= 0) return toast.error('Enter a valid price')
    if (product.durations.some((d) => d.hours === hours))
      return toast.error(`${formatDuration(hours)} already exists for this panel`)
    addDuration(product.id, hours, value)
    setPrice('')
    toast.success(`${formatDuration(hours)} added at ${formatINR(value)}`)
  }

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{product.name}</h2>
          <p className="text-sm text-muted-foreground">{product.category}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Label htmlFor={`stock-${product.id}`} className="text-sm text-muted-foreground">Stock</Label>
            <Input
              id={`stock-${product.id}`}
              inputMode="numeric"
              className="h-8 w-20"
              value={product.stock}
              onChange={(e) => updateProduct(product.id, { stock: Number(e.target.value.replace(/\D/g, '')) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`active-${product.id}`}
              checked={product.active}
              onCheckedChange={(v) => updateProduct(product.id, { active: v })}
            />
            <Label htmlFor={`active-${product.id}`} className="text-sm">{product.active ? 'On sale' : 'Hidden'}</Label>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {product.durations.map((d) => (
          <div key={d.id} className="rounded-lg border bg-secondary/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{formatDuration(d.hours)}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${formatDuration(d.hours)}`}
                onClick={() => removeDuration(product.id, d.id)}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                aria-label={`${formatDuration(d.hours)} price`}
                inputMode="numeric"
                className="pl-6 font-semibold"
                value={d.price}
                onChange={(e) => updateDuration(product.id, { ...d, price: Number(e.target.value.replace(/\D/g, '')) || 0 })}
              />
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
        <div className="grid gap-1.5">
          <Label htmlFor={`dur-${product.id}`} className="text-xs text-muted-foreground">New duration</Label>
          <Input id={`dur-${product.id}`} inputMode="numeric" className="w-20" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
        </div>
        <Select value={unit} onValueChange={(v) => setUnit(v as 'hours' | 'days')}>
          <SelectTrigger className="w-28" aria-label="Duration unit"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="days">Days</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid gap-1.5">
          <Label htmlFor={`price-${product.id}`} className="text-xs text-muted-foreground">Price (₹)</Label>
          <Input id={`price-${product.id}`} inputMode="numeric" className="w-28" placeholder="199" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
        </div>
        <Button type="submit" variant="secondary"><Plus /> Add duration</Button>
      </form>
    </section>
  )
}

function PaymentSettingsForm() {
  const { payment, updatePayment } = useShop()

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file')
    if (file.size > 1.5 * 1024 * 1024) return toast.error('Image must be under 1.5 MB')
    const reader = new FileReader()
    reader.onload = () => {
      updatePayment({ qrImage: String(reader.result) })
      toast.success('QR code updated — customers see it on Add Funds')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div className="rounded-2xl border bg-card p-5">
        <p className="mb-3 text-sm font-medium">Your QR (live preview)</p>
        <div className="rounded-xl bg-white p-3">
          {payment.qrImage ? (
            <img src={payment.qrImage} alt="Your payment QR" className="aspect-square w-full object-contain" />
          ) : (
            <QrPlaceholder className="aspect-square w-full" />
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild className="flex-1">
            <label className="cursor-pointer">
              <Upload /> {payment.qrImage ? 'Replace QR' : 'Upload QR'}
              <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
            </label>
          </Button>
          {payment.qrImage && (
            <Button variant="outline" size="icon" aria-label="Remove QR" onClick={() => updatePayment({ qrImage: null })}>
              <Trash2 />
            </Button>
          )}
        </div>
        {!payment.qrImage && (
          <p className="mt-3 text-xs text-muted-foreground">A sample QR is shown until you upload yours.</p>
        )}
      </div>

      <div className="grid gap-5 rounded-2xl border bg-card p-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="payee">Payee name</Label>
          <Input id="payee" value={payment.payeeName} onChange={(e) => updatePayment({ payeeName: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="upi">UPI ID</Label>
          <Input id="upi" className="font-mono" value={payment.upiId} onChange={(e) => updatePayment({ upiId: e.target.value.trim() })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="min">Minimum deposit (₹)</Label>
          <Input id="min" inputMode="numeric" value={payment.minDeposit} onChange={(e) => updatePayment({ minDeposit: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="note">Instructions shown to customers</Label>
          <Textarea id="note" rows={3} value={payment.note} onChange={(e) => updatePayment({ note: e.target.value })} />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2">
          <Check className="size-3.5 text-success" /> Changes save automatically.
        </p>
      </div>
    </div>
  )
}

function DepositsTable() {
  const { fundRequests, reviewFundRequest } = useShop()
  const sorted = [...fundRequests].sort((a, b) =>
    a.status === 'pending' && b.status !== 'pending' ? -1 : b.status === 'pending' && a.status !== 'pending' ? 1 : 0,
  )
  if (sorted.length === 0)
    return <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No deposit requests yet.</p>

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>UTR</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.user}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatWhen(r.createdAt)}</TableCell>
              <TableCell className="font-mono">{r.utr}</TableCell>
              <TableCell className="text-right font-semibold">{formatINR(r.amount)}</TableCell>
              <TableCell><StatusBadge status={r.status} /></TableCell>
              <TableCell className="text-right">
                {r.status === 'pending' ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        reviewFundRequest(r.id, true)
                        toast.success(`${formatINR(r.amount)} added to ${r.user}`)
                      }}
                    >
                      <Check /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Reject deposit from ${r.user}`}
                      onClick={() => {
                        reviewFundRequest(r.id, false)
                        toast('Deposit rejected')
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Reviewed</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
