import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ChefHat, Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react'

// ── SHA-256 hash via Web Crypto API ──────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Fetch stored credentials
      const { data, error: err } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['username', 'password_hash'])

      if (err) throw new Error(err.message)

      const stored = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
      const inputHash = await sha256(password)

      if (
        username.trim() === stored.username &&
        inputHash === stored.password_hash
      ) {
        // Store session in sessionStorage (cleared on tab close)
        sessionStorage.setItem('hn_admin', '1')
        onLogin()
      } else {
        setError('Incorrect username or password.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Brand header */}
        <div className="bg-slate-900 px-8 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-500 flex items-center justify-center mx-auto mb-4">
            <ChefHat size={28} className="text-white" />
          </div>
          <h1 className="font-serif text-xl font-semibold text-cream-100">Heritage Nusantara</h1>
          <p className="text-xs text-gold-400 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              autoComplete="username"
              className="input"
              placeholder="admin"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null) }}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Default password: <span className="font-mono font-semibold text-slate-600">admin123</span>
          </p>
        </form>
      </div>
    </div>
  )
}
