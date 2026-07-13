import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../utils/format'
import {
  ShoppingCart, Plus, Minus, X, ChefHat,
  Loader2, AlertCircle, CheckCircle, UtensilsCrossed,
  ClipboardList, Send, Clock, ChefHat as CookIcon, Utensils,
  CreditCard, ReceiptText,
} from 'lucide-react'

// ── Status config ─────────────────────────────────────────────
const ORDER_STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    icon:  Clock,
    bg:    'bg-amber-50',
    border:'border-amber-200',
    text:  'text-amber-700',
    dot:   'bg-amber-400',
  },
  Cooking: {
    label: 'Cooking',
    icon:  CookIcon,
    bg:    'bg-blue-50',
    border:'border-blue-200',
    text:  'text-blue-700',
    dot:   'bg-blue-400',
  },
  Served: {
    label: 'Served',
    icon:  Utensils,
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    text:  'text-emerald-700',
    dot:   'bg-emerald-400',
  },
}

const PAYMENT_STATUS_CONFIG = {
  Unpaid:    { label: 'Unpaid',           text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
  Requested: { label: 'Bill Requested',   text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  Paid:      { label: 'Paid',             text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

// ── Order status drawer ───────────────────────────────────────
function OrderStatusDrawer({ tableNumber, onClose }) {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [requesting, setRequesting] = useState(false)

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('table_number', tableNumber)
      .order('created_at', { ascending: true })
    setOrders(data ?? [])
    setLoading(false)
  }, [tableNumber])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`orders-status-table-${tableNumber}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tableNumber, fetchOrders])

  // All unpaid+served orders for this table → one "Request Bill" button
  const billableOrders = orders.filter(
    o => o.payment_status === 'Unpaid' && o.status === 'Served'
  )
  const hasRequestedBill = orders.some(o => o.payment_status === 'Requested')
  const allPaid          = orders.length > 0 && orders.every(o => o.payment_status === 'Paid')
  const grandTotal       = orders
    .filter(o => o.payment_status !== 'Paid')
    .reduce((sum, o) => sum + Number(o.total_price), 0)

  async function handleRequestBill() {
    if (billableOrders.length === 0) return
    setRequesting(true)
    // Mark all billable orders as Requested at once
    await supabase
      .from('orders')
      .update({ payment_status: 'Requested' })
      .in('id', billableOrders.map(o => o.id))
    setRequesting(false)
    fetchOrders()
  }

  // Decide footer state
  const showRequestBtn  = billableOrders.length > 0 && !hasRequestedBill
  const showWaiting     = hasRequestedBill && !allPaid
  const showPaidMsg     = allPaid

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <ReceiptText size={18} className="text-terracotta-500" />
            <h2 className="font-serif font-semibold text-slate-800">Order Status</h2>
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

        {/* Order list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={22} className="animate-spin mr-2" /> Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ClipboardList size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-xs mt-1">Your orders will appear here</p>
            </div>
          ) : (
            orders.map((order, idx) => {
              const sc = ORDER_STATUS_CONFIG[order.status]         ?? ORDER_STATUS_CONFIG.Pending
              const pc = PAYMENT_STATUS_CONFIG[order.payment_status] ?? PAYMENT_STATUS_CONFIG.Unpaid
              const StatusIcon = sc.icon
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${sc.bg} border-b ${sc.border}`}>
                    <div className={`flex items-center gap-2 ${sc.text}`}>
                      <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />
                      <StatusIcon size={14} />
                      <span className="font-semibold text-xs uppercase tracking-wide">{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Order {idx + 1}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pc.bg} ${pc.border} ${pc.text}`}>
                        {pc.label}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 space-y-1">
                    {(order.items ?? []).map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs text-slate-700">
                          <span>
                            <span className="font-semibold">{item.qty}×</span> {item.name}
                          </span>
                          <span className="text-slate-500">{formatRupiah(item.price * item.qty)}</span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-amber-600 italic ml-4">— {item.note}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-cream-200 bg-cream-50">
                    <span className="text-xs text-slate-500">Subtotal</span>
                    <span className="text-xs font-bold text-slate-700">{formatRupiah(order.total_price)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer — single bill section */}
        {orders.length > 0 && (
          <div className="px-5 py-4 border-t border-cream-200 space-y-3 bg-white">
            {/* Grand total */}
            {!allPaid && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Grand Total</span>
                <span className="font-bold text-terracotta-600 text-lg">{formatRupiah(grandTotal)}</span>
              </div>
            )}

            {showRequestBtn && (
              <button
                onClick={handleRequestBill}
                disabled={requesting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-gold-400 text-white font-semibold text-sm
                           hover:bg-gold-500 active:scale-[0.98] transition-all
                           disabled:opacity-50"
              >
                {requesting
                  ? <Loader2 size={16} className="animate-spin" />
                  : <CreditCard size={16} />
                }
                {requesting ? 'Requesting…' : 'Request Bill'}
              </button>
            )}

            {showWaiting && (
              <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 rounded-xl border border-amber-200">
                <Loader2 size={15} className="animate-spin text-amber-500" />
                <p className="text-sm text-amber-700 font-medium">Bill is being prepared…</p>
              </div>
            )}

            {showPaidMsg && (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle size={16} className="text-emerald-500" />
                <p className="text-sm text-emerald-700 font-medium">All paid. Thank you!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const CATEGORIES = ['All', 'Food', 'Drink', 'Dessert']

const CATEGORY_LABELS = {
  Food:    'Food',
  Drink:   'Drink',
  Dessert: 'Dessert',
}

// ── Cart item counter button ──────────────────────────────────
function QtyButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-full flex items-center justify-center
                 bg-terracotta-500 text-white hover:bg-terracotta-600
                 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

// ── Single menu card ──────────────────────────────────────────
function MenuCard({ item, qty, onAdd, onRemove }) {
  const unavailable = !item.is_available

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all
      ${unavailable ? 'opacity-60 border-cream-300' : 'border-cream-300 hover:shadow-md'}`}>

      {/* Image */}
      <div className="relative w-full h-40 bg-cream-100 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={32} className="text-cream-400" />
          </div>
        )}
        {unavailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-slate-800 text-sm leading-tight">{item.name}</p>
        {item.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
        )}
        <p className="font-bold text-terracotta-600 mt-2 text-sm">{formatRupiah(item.price)}</p>

        {/* Cart controls */}
        <div className="mt-3 flex items-center justify-between">
          {qty > 0 ? (
            <div className="flex items-center gap-2">
              <QtyButton onClick={onRemove} disabled={unavailable}>
                <Minus size={12} />
              </QtyButton>
              <span className="w-5 text-center font-bold text-slate-800 text-sm">{qty}</span>
              <QtyButton onClick={onAdd} disabled={unavailable}>
                <Plus size={12} />
              </QtyButton>
            </div>
          ) : (
            <button
              onClick={onAdd}
              disabled={unavailable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                         bg-terracotta-500 text-white text-xs font-semibold
                         hover:bg-terracotta-600 active:scale-95 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={13} /> Add
            </button>
          )}
          {qty > 0 && (
            <span className="text-xs text-terracotta-600 font-semibold">
              {formatRupiah(item.price * qty)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cart drawer ───────────────────────────────────────────────
function CartDrawer({ cart, menuItems, tableNumber, onClose, onOrderSuccess, onNoteChange }) {
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

// ── Order success screen ──────────────────────────────────────
function OrderSuccess({ tableNumber, onOrderMore }) {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle size={36} className="text-emerald-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-800">Order Received!</h2>
        <p className="text-slate-500 text-sm">
          Your order for <span className="font-bold text-terracotta-600">Table #{tableNumber}</span> is
          being prepared by our kitchen. Please wait a moment.
        </p>
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 rounded-xl border border-amber-200">
          <ClipboardList size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Our team will prepare your order shortly.
          </p>
        </div>
        <button
          onClick={onOrderMore}
          className="w-full py-3 rounded-xl bg-terracotta-500 text-white font-semibold text-sm
                     hover:bg-terracotta-600 transition-colors"
        >
          Order More
        </button>
      </div>
    </div>
  )
}

// ── No table screen ───────────────────────────────────────────
function NoTable() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <AlertCircle size={32} className="text-amber-500" />
        </div>
        <h2 className="font-serif text-xl font-bold text-slate-800">Invalid QR Code</h2>
        <p className="text-slate-500 text-sm">
          Please scan the QR code on your table to view the menu.
        </p>
      </div>
    </div>
  )
}

// ── Main CustomerMenu component ───────────────────────────────
export default function CustomerMenu() {
  const [searchParams]          = useSearchParams()
  const tableNumber             = parseInt(searchParams.get('table'), 10)

  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [cart, setCart]           = useState({})   // { [itemId]: { qty, note } }
  const [cartOpen, setCartOpen]   = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [ordered, setOrdered]     = useState(false)

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

  // ── Cart helpers ──────────────────────────────────────────
  function addToCart(id) {
    setCart(prev => ({
      ...prev,
      [id]: { qty: (prev[id]?.qty ?? 0) + 1, note: prev[id]?.note ?? '' },
    }))
  }
  function removeFromCart(id) {
    setCart(prev => {
      const newQty = (prev[id]?.qty ?? 0) - 1
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { ...prev[id], qty: newQty } }
    })
  }
  function updateNote(id, note) {
    setCart(prev => ({ ...prev, [id]: { ...prev[id], note } }))
  }

  const cartCount = Object.values(cart).reduce((a, { qty }) => a + qty, 0)

  // ── Filter by category ────────────────────────────────────
  const filtered = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(m => m.category === activeCategory)

  // ── Order success ─────────────────────────────────────────
  if (ordered) {
    return (
      <OrderSuccess
        tableNumber={tableNumber}
        onOrderMore={() => { setOrdered(false); setCart({}) }}
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

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Status button */}
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

      {/* ── Menu grid ── */}
      <main className="max-w-2xl mx-auto px-4 py-6">
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
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Floating cart button (mobile, when cart has items) ── */}
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
            <span className="ml-1 font-bold">
              · {formatRupiah(
                  Object.entries(cart).reduce((sum, [id, { qty }]) => {
                    const item = menuItems.find(m => m.id === id)
                    return sum + (item ? item.price * qty : 0)
                  }, 0)
                )}
            </span>
          </button>
        </div>
      )}

      {/* ── Cart drawer ── */}
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

      {/* ── Order status drawer ── */}
      {statusOpen && (
        <OrderStatusDrawer
          tableNumber={tableNumber}
          onClose={() => setStatusOpen(false)}
        />
      )}
    </div>
  )
}
