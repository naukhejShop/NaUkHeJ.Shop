import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { loadProducts, saveProduct, addDuration, uploadKeys, loadAdminDeposits, approveDeposit, rejectDeposit, loadCustomers, type ShopProduct, type DepositRow } from '@/lib/supabase-shop'
import { formatINR } from '@/lib/fixtures'
import { getStoredSession } from '@/lib/auth'

export const Route = createFileRoute('/admin')({ component: AdminPage, head: () => ({ meta: [{ title: 'Admin · NAUKHEJ SHOP' }] }) })

function AdminPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [deposits, setDeposits] = useState<DepositRow[]>([])
  const [customers, setCustomers] = useState<Array<{user_id:string;email:string;wallet_balance_paise:number;created_at:string}>>([])
  const [busy, setBusy] = useState(false)
  const [productId, setProductId] = useState('')
  const [durationId, setDurationId] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Android')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [durationName, setDurationName] = useState('1 Hour')
  const [durationValue, setDurationValue] = useState('1')
  const [durationUnit, setDurationUnit] = useState('hours')
  const [durationPrice, setDurationPrice] = useState('')
  const [keysText, setKeysText] = useState('')
  const [tab, setTab] = useState<'products'|'deposits'|'customers'>('products')
  const isOwner = getStoredSession()?.user.email?.toLowerCase() === 'alamnaukhej305@gmail.com'

  async function refresh() {
    const p = await loadProducts()
    setProducts(p)
    if (!productId && p[0]) setProductId(String(p[0].id))
    const d = await loadAdminDeposits()
    setDeposits(d)
    const c = await loadCustomers()
    setCustomers(c)
  }
  useEffect(() => { refresh().catch(e => toast.error(e instanceof Error ? e.message : 'Could not load admin data')) }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price || Number(price) <= 0) return toast.error('Product name and valid price are required')
    setBusy(true)
    try {
      await saveProduct({ name:name.trim(), description, priceRupees:Number(price), category, imageUrl, videoUrl, productType:'both' })
      setName(''); setDescription(''); setPrice(''); setImageUrl(''); setVideoUrl('')
      await refresh(); toast.success('Product saved to database')
    } catch(e) { toast.error(e instanceof Error ? e.message : 'Save failed') } finally { setBusy(false) }
  }
  async function saveDuration(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !durationName.trim() || Number(durationValue)<=0 || Number(durationPrice)<=0) return toast.error('Complete all duration fields')
    setBusy(true)
    try {
      await addDuration({productId:Number(productId),name:durationName,value:Number(durationValue),unit:durationUnit,priceRupees:Number(durationPrice)})
      await refresh(); toast.success('Duration and price saved')
    } catch(e) { toast.error(e instanceof Error ? e.message : 'Duration save failed') } finally { setBusy(false) }
  }
  async function saveKeys(e: React.FormEvent) {
    e.preventDefault()
    const keys=keysText.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
    if (!durationId || !keys.length) return toast.error('Choose duration and paste keys')
    setBusy(true)
    try {
      const count=await uploadKeys(Number(durationId),keys)
      setKeysText(''); await refresh(); toast.success(`${count} keys added to inventory`)
    } catch(e) { toast.error(e instanceof Error ? e.message : 'Key upload failed') } finally { setBusy(false) }
  }
  async function review(id:number, yes:boolean) {
    setBusy(true)
    try { yes ? await approveDeposit(id) : await rejectDeposit(id); await refresh(); toast.success(yes?'Deposit approved and wallet credited':'Deposit rejected') }
    catch(e) { toast.error(e instanceof Error ? e.message : 'Review failed') } finally { setBusy(false) }
  }

  if (!isOwner) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Admin access required</h1><p className="mt-3 text-muted-foreground">Login with the owner account to manage NAUKHEJ SHOP.</p><Button className="mt-6" asChild><a href="/login">Login</a></Button></main>

  return <main className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="text-3xl font-bold">NAUKHEJ SHOP · Admin</h1>
    <p className="mt-2 text-muted-foreground">Live Supabase management. Database functions verify admin permissions on every action.</p>
    <div className="mt-6 flex flex-wrap gap-2">{(['products','deposits','customers'] as const).map(x=><Button key={x} variant={tab===x?'default':'outline'} onClick={()=>setTab(x)}>{x==='products'?'Products & keys':x==='deposits'?'UPI deposits':'Customers'}</Button>)}</div>
    {tab==='products' && <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="grid gap-3 rounded-xl border p-5"><h2 className="text-xl font-semibold">Add product</h2>
        <Label>Product name</Label><Input value={name} onChange={e=>setName(e.target.value)} required />
        <Label>Category</Label><Input value={category} onChange={e=>setCategory(e.target.value)} />
        <Label>Description</Label><Textarea value={description} onChange={e=>setDescription(e.target.value)} />
        <Label>Base price (₹)</Label><Input type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required />
        <Label>Product photo URL</Label><Input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..." />
        <Label>Product video URL</Label><Input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="https://..." />
        <Button disabled={busy}>Save product</Button>
      </form>
      <div className="grid content-start gap-6">
        <form onSubmit={saveDuration} className="grid gap-3 rounded-xl border p-5"><h2 className="text-xl font-semibold">Add duration & price</h2>
          <Label>Product</Label><select className="h-10 rounded-md border bg-background px-3" value={productId} onChange={e=>setProductId(e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <Label>Duration label</Label><Input value={durationName} onChange={e=>setDurationName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2"><div><Label>Value</Label><Input type="number" min="1" value={durationValue} onChange={e=>setDurationValue(e.target.value)} /></div><div><Label>Unit</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={durationUnit} onChange={e=>setDurationUnit(e.target.value)}><option value="hours">Hours</option><option value="days">Days</option></select></div></div>
          <Label>Price (₹)</Label><Input type="number" min="0.01" step="0.01" value={durationPrice} onChange={e=>setDurationPrice(e.target.value)} />
          <Button disabled={busy}>Save duration</Button>
        </form>
        <form onSubmit={saveKeys} className="grid gap-3 rounded-xl border p-5"><h2 className="text-xl font-semibold">Upload inventory keys</h2>
          <Label>Product and duration</Label><select className="h-10 rounded-md border bg-background px-3" value={durationId} onChange={e=>setDurationId(e.target.value)}><option value="">Choose duration</option>{products.flatMap(p=>p.durations.map(d=><option key={d.id} value={d.id}>{p.name} · {d.duration_name}</option>))}</select>
          <Label>Paste keys (one key per line)</Label><Textarea rows={7} value={keysText} onChange={e=>setKeysText(e.target.value)} placeholder={'KEY-001\nKEY-002\nKEY-003'} />
          <Button disabled={busy}>Add keys to stock</Button>
        </form>
      </div>
      <section className="rounded-xl border p-5 lg:col-span-2"><h2 className="text-xl font-semibold">Products in database</h2><div className="mt-3 grid gap-2">{products.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-2 border-b py-2"><span className="font-medium">{p.name} · {p.category}</span><span className="text-sm text-muted-foreground">{p.stock} keys · {p.durations.length} durations · {p.is_active?'Active':'Hidden'}</span></div>)}</div></section>
    </div>}
    {tab==='deposits' && <section className="mt-6 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Customer ID</th><th className="p-3">UTR</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{deposits.map(d=><tr key={d.id} className="border-b"><td className="p-3">{d.user_id}</td><td className="p-3 font-mono">{d.utr_number}</td><td className="p-3">{formatINR(d.amount_paise/100)}</td><td className="p-3">{d.payment_status}</td><td className="p-3">{d.payment_status==='pending'&&<div className="flex gap-2"><Button size="sm" disabled={busy} onClick={()=>review(d.id,true)}>Approve</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>review(d.id,false)}>Reject</Button></div>}</td></tr>)}</tbody></table>{!deposits.length&&<p className="p-8 text-center text-muted-foreground">No deposit requests.</p>}</section>}
    {tab==='customers' && <section className="mt-6 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Email</th><th className="p-3">Wallet</th><th className="p-3">Joined</th></tr></thead><tbody>{customers.map(c=><tr key={c.user_id} className="border-b"><td className="p-3">{c.email}</td><td className="p-3">{formatINR(Number(c.wallet_balance_paise)/100)}</td><td className="p-3">{new Date(c.created_at).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></section>}
  </main>
}
