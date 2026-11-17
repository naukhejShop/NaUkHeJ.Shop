import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Clock, Copy, QrCode, Send, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { cn } from '@/lib/utils'
import { useShop } from '@/lib/shop-store'
import { formatINR, formatWhen } from '@/lib/fixtures'

export const Route = createFileRoute('/wallet')({
  head: () => ({ meta: [{ title: 'Add Funds · Naukhejshop.com' }] }),
  component: WalletPage,
})

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000]

function WalletPage() {
  const { balance, payment, fundRequests, currentUser, requestFunds } = useShop()
  const [amount, setAmount] = useState('200')
  const [utr, setUtr] = useState('')
  const [errors, setErrors] = useState<{ amount?: string; utr?: string }>({})

  const myRequests = fundRequests.filter((r) => r.user === currentUser)
  const pendingTotal = myRequests
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    const next: typeof errors = {}
    if (!Number.isFinite(value) || value < payment.minDeposit)
      next.amount = `Minimum deposit is ${formatINR(payment.minDeposit)}`
    if (!/^\d{12}$/.test(utr.trim()))
      next.utr = 'Enter the 12-digit UTR / reference number from your UPI app'
    else if (fundRequests.some((r) => r.utr === utr.trim()))
      next.utr = 'This UTR has already been submitted'
    setErrors(next)
    if (Object.keys(next).length) return
    requestFunds(value, utr.trim())
    setUtr('')
    toast.success('Payment submitted for verification', {
      description: `${formatINR(value)} will be added once verified.`,
    })
  }

  async function copyUpi() {
    await navigator.clipboard?.writeText(payment.upiId)
    toast.success('UPI ID copied')
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-bold">Add funds</h1>
          <p className="mt-1 text-muted-foreground">Scan the QR with any UPI app, then submit your UTR.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border bg-card px-5 py-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Wallet className="size-3.5" /> Balance</p>
            <p className="font-display text-2xl font-bold text-primary tabular-nums">{formatINR(balance)}</p>
          </div>
          <div className="rounded-xl border bg-card px-5 py-3">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="size-3.5" /> Pending</p>
            <p className="font-display text-2xl font-bold tabular-nums">{formatINR(pendingTotal)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section aria-labelledby="pay-title" className="rounded-2xl border bg-card p-6">
          <h2 id="pay-title" className="flex items-center gap-2 font-display text-lg font-semibold">
            <QrCode className="size-5 text-primary" /> Scan & pay
          </h2>
          <div className="mx-auto mt-5 w-full max-w-64 rounded-xl bg-white p-3 shadow-lg">
            {payment.qrImage ? (
              <img src={payment.qrImage} alt={`UPI QR code for ${payment.payeeName}`} className="aspect-square w-full object-contain" />
            ) : (
              <QrPlaceholder className="aspect-square w-full" />
            )}
          </div>
          <p className="mt-4 text-center font-semibold">{payment.payeeName}</p>
          <button
            type="button"
            onClick={copyUpi}
            className="mx-auto mt-2 flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm transition-colors hover:border-primary/60"
          >
            {payment.upiId} <Copy className="size-3.5 text-muted-foreground" />
          </button>
          <p className="mt-5 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">{payment.note}</p>
        </section>

        <section aria-labelledby="submit-title" className="rounded-2xl border bg-card p-6">
          <h2 id="submit-title" className="font-display text-lg font-semibold">Submit your payment</h2>
          <form onSubmit={submit} noValidate className="mt-5 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount paid (₹)</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={amount === String(a)}
                    onClick={() => setAmount(String(a))}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
                      amount === String(a) ? 'border-primary bg-primary/10 text-primary' : 'hover:border-muted-foreground/50',
                    )}
                  >
                    {formatINR(a)}
                  </button>
                ))}
              </div>
              <Input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                className="h-11 text-lg font-semibold"
              />
              {errors.amount && <p id="amount-error" className="text-sm text-destructive">{errors.amount}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="utr">UTR / UPI reference number</Label>
              <Input
                id="utr"
                inputMode="numeric"
                placeholder="e.g. 432918756120"
                maxLength={12}
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                aria-invalid={!!errors.utr}
                aria-describedby={errors.utr ? 'utr-error' : 'utr-help'}
                className="h-11 font-mono tracking-wider"
              />
              {errors.utr ? (
                <p id="utr-error" className="text-sm text-destructive">{errors.utr}</p>
              ) : (
                <p id="utr-help" className="text-xs text-muted-foreground">Find it in your UPI app under transaction details.</p>
              )}
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start">
              <Send /> Submit for verification
            </Button>
          </form>

          <h3 className="mt-10 mb-3 font-display text-lg font-semibold">Deposit history</h3>
          {myRequests.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No deposits yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>UTR</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatWhen(r.createdAt)}</TableCell>
                      <TableCell className="font-mono">{r.utr}</TableCell>
                      <TableCell className="text-right font-semibold">{formatINR(r.amount)}</TableCell>
                      <TableCell className="text-right"><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
