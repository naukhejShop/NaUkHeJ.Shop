import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { signIn, signUp } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password)
      if (mode === 'signup' && !('access_token' in result)) {
        toast.success('Account created. Check your email to confirm, then log in.')
        setMode('login')
      } else {
        toast.success('Login successful')
        await navigate({ to: '/' })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">NAUKHEJ SHOP</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in or create your customer account securely.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border bg-background px-3 py-3 outline-none focus:border-primary" placeholder="you@example.com" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border bg-background px-3 py-3 outline-none focus:border-primary" placeholder="At least 6 characters" />
          </label>
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}</Button>
        </form>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-5 w-full text-center text-sm text-primary hover:underline">
          {mode === 'login' ? 'New customer? Create an account' : 'Already registered? Login'}
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">← Back to shop</Link></p>
      </div>
    </section>
  )
}
