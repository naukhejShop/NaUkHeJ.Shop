import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { KeyRound, Menu, Plus, ShieldCheck, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useShop } from '@/lib/shop-store'
import { getStoredSession, signOut } from '@/lib/auth'
import { toast } from 'sonner'
import { formatINR } from '@/lib/fixtures'

const NAV = [
  { to: '/', label: 'Shop' },
  { to: '/wallet', label: 'Add Funds' },
  { to: '/keys', label: 'My Keys' },
  { to: '/admin', label: 'Admin' },
] as const

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground glow-primary">
        <KeyRound className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-wide">
        Naukhej<span className="text-primary">shop</span>
        <span className="text-muted-foreground">.com</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const { balance } = useShop()
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    const syncSession = () => setSessionEmail(getStoredSession()?.user.email ?? null)
    syncSession()
    window.addEventListener('naukhej-auth-change', syncSession)
    return () => window.removeEventListener('naukhej-auth-change', syncSession)
  }, [])
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === '/' }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground motion-reduce:transition-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wallet"
            className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary/60"
            aria-label={`Wallet balance ${formatINR(balance)}, add funds`}
          >
            <Wallet className="size-4 text-primary" />
            <span className="tabular-nums">{formatINR(balance)}</span>
            <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-3" />
            </span>
          </Link>
          {sessionEmail ? (
            <Button variant="outline" size="sm" onClick={async () => {
              try { await signOut(); setSessionEmail(null); toast.success('Logged out') }
              catch { toast.error('Logout failed. Please try again.') }
            }}>Logout</Button>
          ) : (
            <Button asChild size="sm" variant="outline"><Link to="/login">Login</Link></Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display">Naukhejshop</SheetTitle>
                <SheetDescription>Instant panel keys</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === '/' }}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <p className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-success" />
          Secure UPI payments · Keys delivered instantly
        </p>
        <p>© {new Date().getFullYear()} Naukhejshop.com</p>
      </div>
    </footer>
  )
}

/** Shown when the owner hasn't uploaded a QR yet. */
export function QrPlaceholder({ className }: { className?: string }) {
  // Deterministic QR-looking pattern so the placeholder is stable across renders.
  const size = 25
  const cells: [number, number][] = []
  let seed = 7
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (seed * 9301 + 49297) % 233280
      const inFinder =
        (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)
      if (!inFinder && seed / 233280 > 0.52) cells.push([x, y])
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`f${x}${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  )
  return (
    <svg
      viewBox={`-1 -1 ${size + 2} ${size + 2}`}
      className={className}
      role="img"
      aria-label="Sample QR code placeholder"
    >
      <rect x={-1} y={-1} width={size + 2} height={size + 2} fill="white" />
      <g className="text-neutral-900" fill="currentColor">
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
        {finder(0, 0)}
        {finder(size - 7, 0)}
        {finder(0, size - 7)}
      </g>
    </svg>
  )
}
