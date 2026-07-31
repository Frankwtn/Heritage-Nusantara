import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../utils/format'
import {
  ShoppingCart, ChefHat, Loader2, AlertCircle,
  UtensilsCrossed, ReceiptText, Search, X,
} from 'lucide-react'

import { CATEGORIES, CATEGORY_LABELS } from './constants/orderConfig'
import { useCart } from './hooks/useCart'
import MenuCard from './components/MenuCard'
import MenuPreviewModal from './components/MenuPreviewModal'
import CartDrawer from './components/CartDrawer'
import OrderStatusDrawer from './components/OrderStatusDrawer'
import OrderSuccess from './components/OrderSuccess'
import NoTable from './components/NoTable'

export default function CustomerMenu() {
  const [searchParams]  = useSearchParams()
  const tableNumber     = parseInt(searchParams.get('table'), 10)

  const [menuItems, setMenuItems]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch]               = useState('')
  const [cartOpen, setCartOpen]           = useState(false)
  const [statusOpen, setStatusOpen]       = useState(false)
  const [ordered, setOrdered]             = useState(false)
  const [previewItem, setPreviewItem]     = useState(null)

  const { cart, cartCount, addToCart, removeFromCart, updateNote, clearCart } = useCart()

  // ── Validate table number ─────────────────────────────────
  if (!tableNumber || isNaN(tableNumber)) return <NoTable />

  // ── Fetch menu ────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('menus')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('name')
    if (err) setError(err.message)
    else setMenuItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  // ── Filter by category + search ──────────────────────────
  const filtered = menuItems.filter(m => {
    const matchCat    = activeCategory === 'All' || m.category === activeCategory
    const matchSearch = search.trim() === '' ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // ── Cart total (for floating button) ─────────────────────
  const cartTotal = Object.entries(cart).reduce((sum, [id, { qty }]) => {
    const item = menuItems.find(m => m.id === id)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  // ── Order success screen ──────────────────────────────────
  if (ordered) {
    return (
      <OrderSuccess
        tableNumber={tableNumber}
        onOrderMore={() => { setOrdered(false); clearCart() }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream-100">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-cream-300 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta-500 flex items-center justify-center">
              <ChefHat size={17} className="text-white" />
            </div>
            <div>
              <p className="font-serif font-semibold text-terracotta-700 text-sm leading-tight">
                Heritage Nusantara
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">Table #{tableNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Order Status button */}
            <button
              onClick={() => setStatusOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl
                         bg-white border border-cream-300 text-slate-700 text-sm font-semibold
                         hover:bg-cream-100 transition-colors active:scale-95"
            >
              <ReceiptText size={16} className="text-terracotta-500" />
              <span className="hidden sm:inline">Order Status</span>
            </button>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl
                         bg-terracotta-500 text-white text-sm font-semibold
                         hover:bg-terracotta-600 transition-colors active:scale-95"
            >
              <ShoppingCart size={16} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold-400
                                 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Category tabs ── */}
      <div className="sticky top-14 z-10 bg-white border-b border-cream-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-terracotta-500 text-white'
                    : 'text-slate-600 hover:bg-cream-100'
                }`}
              >
                {cat === 'All' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cream-300 bg-white
                       text-sm text-slate-800 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-terracotta-400
                       focus:border-terracotta-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-slate-400 mt-1.5 px-1">
            {filtered.length === 0
              ? 'No items found'
              : `${filtered.length} item${filtered.length > 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {/* ── Menu grid ── */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading menu…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <UtensilsCrossed size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                qty={cart[item.id]?.qty ?? 0}
                onAdd={() => addToCart(item.id)}
                onRemove={() => removeFromCart(item.id)}
                onPreview={() => setPreviewItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Floating cart button (mobile) ── */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl
                       bg-terracotta-500 text-white font-semibold shadow-xl
                       hover:bg-terracotta-600 active:scale-95 transition-all"
          >
            <ShoppingCart size={18} />
            <span>{cartCount} item{cartCount > 1 ? 's' : ''} selected</span>
            <span className="ml-1 font-bold">· {formatRupiah(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Drawers & modals ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          menuItems={menuItems}
          tableNumber={tableNumber}
          onClose={() => setCartOpen(false)}
          onNoteChange={updateNote}
          onOrderSuccess={() => { setCartOpen(false); setOrdered(true) }}
        />
      )}

      {statusOpen && (
        <OrderStatusDrawer
          tableNumber={tableNumber}
          onClose={() => setStatusOpen(false)}
        />
      )}

      {previewItem && (
        <MenuPreviewModal
          item={previewItem}
          qty={cart[previewItem.id]?.qty ?? 0}
          onAdd={() => addToCart(previewItem.id)}
          onRemove={() => removeFromCart(previewItem.id)}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  )
}
