import { useState } from 'react'
import { ShoppingCart, X, UtensilsCrossed, AlertCircle, Loader2, Send } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatRupiah } from '../../../utils/format'

export default function CartDrawer({ cart, menuItems, tableNumber, onClose, onOrderSuccess, onNoteChange }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const cartEntries = Object.entries(cart).filter(([, v]) => v.qty > 0)
  const total = cartEntries.reduce((sum, [id, { qty }]) => {
    const item = menuItems.find(m => m.id === id)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  async function handleOrder() {
    setLoading(true)
    setError(null)

    const items = cartEntries.map(([id, { qty, note }]) => {
      const item = menuItems.find(m => m.id === id)
      return {
        id,
        name:  item.name,
        price: item.price,
        qty,
        ...(note.trim() ? { note: note.trim() } : {}),
      }
    })

    const { error: err } = await supabase.from('orders').insert([{
      table_number:   tableNumber,
      items,
      total_price:    total,
      status:         'Pending',
      payment_status: 'Unpaid',
    }])

    setLoading(false)
    if (err) { setError(err.message); return }
    onOrderSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-terracotta-500" />
            <h2 className="font-serif font-semibold text-slate-800">Your Order</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Table badge */}
        <div className="px-5 py-3 bg-cream-50 border-b border-cream-200">
          <span className="text-xs text-slate-500">Table</span>
          <span className="ml-2 font-bold text-terracotta-600 text-sm">#{tableNumber}</span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cartEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShoppingCart size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs mt-1">Add items from the menu</p>
            </div>
          ) : (
            cartEntries.map(([id, { qty, note }]) => {
              const item = menuItems.find(m => m.id === id)
              if (!item) return null
              return (
                <div key={id} className="space-y-2">
                  {/* Item row */}
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-cream-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{formatRupiah(item.price)} × {qty}</p>
                    </div>
                    <p className="text-sm font-bold text-terracotta-600 flex-shrink-0">
                      {formatRupiah(item.price * qty)}
                    </p>
                  </div>
                  {/* Per-item note */}
                  <textarea
                    rows={2}
                    value={note}
                    onChange={e => onNoteChange(id, e.target.value)}
                    placeholder={`Note for ${item.name}… (e.g. no spice)`}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 text-xs
                               focus:outline-none focus:ring-2 focus:ring-terracotta-400
                               resize-none placeholder-slate-400 bg-cream-50"
                  />
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-cream-200 space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl text-xs text-red-700 border border-red-200">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Total</span>
            <span className="font-bold text-terracotta-600 text-lg">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={handleOrder}
            disabled={loading || cartEntries.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-terracotta-500 text-white font-semibold text-sm
                       hover:bg-terracotta-600 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={16} />
            }
            {loading ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
