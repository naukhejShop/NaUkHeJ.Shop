const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export type AuthSession = {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: { id: string; email?: string }
}

const SESSION_KEY = 'naukhejshop:auth:v1'

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Login setup is not complete yet. Please try again later.')
  }
  return { url: SUPABASE_URL.replace(/\\/$/, ''), key: SUPABASE_KEY }
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

export function clearStoredSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY)
}

async function authRequest(path: string, body: Record<string, string>) {
  const { url, key } = config()
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify(body),
  })
  const result = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    user?: { id: string; email?: string }
    msg?: string
    message?: string
    error_description?: string
  }
  if (!response.ok) {
    throw new Error(result.msg || result.message || result.error_description || 'Unable to sign in.')
  }
  if (result.access_token && result.refresh_token && result.user) {
    const session: AuthSession = {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: result.expires_in ? Math.floor(Date.now() / 1000) + result.expires_in : undefined,
      user: result.user,
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    window.dispatchEvent(new Event('naukhej-auth-change'))
  }
  return result
}

export async function signIn(email: string, password: string) {
  return authRequest('token?grant_type=password', { email, password })
}

export async function signUp(email: string, password: string) {
  return authRequest('signup', { email, password })
}

export async function signOut() {
  const session = getStoredSession()
  if (session && SUPABASE_URL && SUPABASE_KEY) {
    await fetch(`${SUPABASE_URL.replace(/\\/$/, '')}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    })
  }
  clearStoredSession()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('naukhej-auth-change'))
}
