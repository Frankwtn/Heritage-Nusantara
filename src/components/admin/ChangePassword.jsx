import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { KeyRound, Eye, EyeOff, Loader2, AlertCircle, Check, X } from 'lucide-react'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function ChangePassword({ onClose }) {
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showCur, setShowCur]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!current || !next || !confirm) {
      setError('All fields are required.'); return
    }
    if (next.length < 6) {
      setError('New password must be at least 6 characters.'); return
    }
    if (next !== confirm) {
      setError('New passwords do not match.'); return
    }

    setLoading(true)
    try {
      // Verify current password
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'password_hash')
        .single()

      const currentHash = await sha256(current)
      if (currentHash !== data?.value) {
        setError('Current password is incorrect.')
        setLoading(false)
        return
      }

      // Update to new password
      const newHash = await sha256(next)
      const { error: err } = await supabase
        .from('admin_settings')
        .update({ value: newHash })
        .eq('key', 'password_hash')

      if (err) throw new Error(err.message)

      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-terracotta-500" />
            <h2 className="font-serif text-lg font-semibold text-terracotta-700">Change Password</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Current password */}
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                type={showCur ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={current}
                onChange={e => { setCurrent(e.target.value); setError(null) }}
              />
              <button type="button" onClick={() => setShowCur(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Min. 6 characters"
                value={next}
                onChange={e => { setNext(e.target.value); setError(null) }}
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(null) }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0" /> {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              <Check size={15} className="flex-shrink-0" /> Password changed successfully!
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || success} className="btn-primary">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {loading ? 'Saving…' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
