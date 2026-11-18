import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loadMyWallet, loadMyDeposits, submitDeposit, type DepositRow } from '@/lib/supabase-shop'
import { getStoredSession } from '@/lib/auth'
import { formatINR } from '@/lib/fixtures'

export const Route = createFileRoute('/wallet')({ component: WalletPage, head: () => ({ meta: [{ title: 'Wallet · NAUKHEJ SHOP' }] }) })

function WalletPage() {
  const [balance,setBalance]=useState(0)
  const [deposits,setDeposits]=useState<DepositRow[]>([])
  const [amount,setAmount]=useState('200')
  const [utr,setUtr]=useState('')
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const loggedIn=!!getStoredSession()?.user?.id
  const upiId=(import.meta.env.VITE_UPI_ID as string|undefined)||''

  async function refresh() {
    const [b,d]=await Promise.all([loadMyWallet(),loadMyDeposits()])
    setBalance(b);setDeposits(d)
  }
  useEffect(()=>{ if(loggedIn) refresh().catch(e=>toast.error(e instanceof Error?e.message:'Could not load wallet')).finally(()=>setLoading(false)); else setLoading(false) },[])

  async function submit(e:React.FormEvent) {
    e.preventDefault()
    const value=Number(amount)
    if(!Number.isFinite(value)||value<1) return toast.error('Enter a valid amount')
    if(!/^\d{12}$/.test(utr.trim())) return toast.error('Enter the 12-digit UTR from your UPI app')
    setBusy(true)
    try { await submitDeposit(value,utr.trim());setUtr('');await refresh();toast.success('Deposit request sent. Wallet updates after admin approval.') }
    catch(e) { toast.error(e instanceof Error?e.message:'Deposit request failed') }
    finally { setBusy(false) }
  }

  if(!loggedIn) return <main className="mx-auto max-w-lg px-4 py-20 text-center"><h1 className="text-3xl font-bold">Login to your wallet</h1><p className="mt-2 text-muted-foreground">Sign in to see your balance and submit deposits.</p><Button asChild className="mt-6"><a href="/login">Login / Sign up</a></Button></main>
  return <main className="mx-auto max-w-3xl px-4 py-10">
    <h1 className="text-3xl font-bold">My wallet</h1>
    <section className="mt-5 rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Available balance</p><p className="mt-1 text-4xl font-bold">{loading?'Loading…':formatINR(balance)}</p></section>
    <section className="mt-6 rounded-xl border p-5"><h2 className="text-xl font-semibold">Add funds by UPI</h2>
      {upiId?<p className="mt-3 rounded-lg bg-secondary p-3">Pay to UPI ID: <strong className="font-mono">{upiId}</strong></p>:<p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">UPI ID is not configured yet. Add VITE_UPI_ID in Netlify environment variables before accepting payments.</p>}
      <p className="mt-3 text-sm text-muted-foreground">Pay using your UPI app, then enter the exact amount and 12-digit UTR. Funds are credited only after admin verifies the payment.</p>
      <form onSubmit={submit} className="mt-5 grid gap-3"><Label>Amount (₹)</Label><Input type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} required/><Label>12-digit UTR / UPI reference</Label><Input inputMode="numeric" maxLength={12} value={utr} onChange={e=>setUtr(e.target.value.replace(/\D/g,''))} placeholder="Enter UTR" required/><Button disabled={busy||loading||!upiId}>{busy?'Submitting…':'Submit deposit request'}</Button></form>
    </section>
    <section className="mt-6 rounded-xl border p-5"><h2 className="text-xl font-semibold">Deposit history</h2><div className="mt-3 grid gap-2">{deposits.map(d=><div key={d.id} className="flex flex-wrap justify-between gap-2 border-b py-3 text-sm"><span className="font-mono">{d.utr_number}</span><span>{formatINR(d.amount_paise/100)}</span><span className="capitalize">{d.payment_status}</span><span className="text-muted-foreground">{new Date(d.created_at).toLocaleString('en-IN')}</span></div>)}{!deposits.length&&<p className="py-5 text-sm text-muted-foreground">No deposits yet.</p>}</div></section>
  </main>
}
