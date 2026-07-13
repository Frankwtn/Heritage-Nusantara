import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate } from '../../utils/format'
import {
  RefreshCw, CheckCircle, Loader2, AlertCircle,
  X, ClipboardList, ChevronDown,
} from 'lucide-react'

const ORDER_STATUSES  = ['Pending', 'Cooking', 'Served']
const PAYMENT_STATUSES = ['Unpaid', 'Requested', 'Paid']

// ── Status badge helper ───────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Pending:   'badge-pending',
    Cooking:   'badge-cooking',
    Served:    'badge-served',
    Unpaid:    'badge-unpaid',
    Requested: 'badge-requested',
    Paid:      'badge-paid',
  }
  return <span className={map[status] ?? 'badge-pending'}>{status}</span>
}

// ── Order items list ──────────────────────────────────────────
function OrderItems({ items }) {
  if (!items || items.length === 0) return <span className="text-slate-400 italic text-xs">No items</span>
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-xs text-slate-600">
          <div className="flex items-start gap-1">
            <span className="font-medium flex-shrink-0">{item.qty}×</span>
            <span>{item.name}</span>
            <span className="text-slate-400 ml-1 flex-shrink-0">({formatRupiah(item.price * item.qty)})</span>
          </div>
          {item.note && (
            <p className="ml-4 mt-0.5 text-[11px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200">
              📝 {item.note}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── Order card ────────────────────────────────────────────────
function OrderCard({ order, onStatusChange, onCloseBill, updating }) {
  const isUpdating = updating === order.id

  return (
    <div className={`card transition-all duration-300 ${
      order.payment_status === 'Requested' ? 'ring-2 ring-gold-400 shadow-md' : ''
    }`}>
      {/* Card header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center flex-shrink-0">
            <span className="font-serif font-bold text-terracotta-600 text-sm">
              {order.table_number}
            </span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Table {order.table_number}</p>
            <p className="text-[10px] text-slate-400">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      {/* Card body */}
      <div className="card-body space-y-4">
        {/* Items */}
        <div>
          <p className="label mb-1.5">Order Items</p>
          <OrderItems items={order.items} />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-cream-200">
          <span className="text-xs text-slate-500 font-medium">Total</span>
          <span className="font-bold text-terracotta-600">{formatRupiah(order.total_price)}</span>
        </div>

        {/* Order status control */}
        <div>
          <label className="label">Order Status</label>
          <div className="relative">
            <select
              disabled={isUpdating || order.payment_status === 'Paid'}
              value={order.status}
              onChange={e => onStatusChange(order.id, 'status', e.target.value)}
              className="input appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Payment request notice */}
        {order.payment_status === 'Requested' && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertCircle size={14} className="flex-shrink-0" />
            Customer has requested the bill.
          </div>
        )}

        {/* Close bill button */}
        {order.payment_status !== 'Paid' && (
          <button
            disabled={isUpdating}
            onClick={() => onCloseBill(order.id)}
            className="btn-gold w-full justify-center"
          >
            {isUpdating
              ? <Loader2 size={15} className="animate-spin" />
              : <CheckCircle size={15} />
            }
            Confirm Payment &amp; Close Bill
          </button>
        )}

        {order.payment_status === 'Paid' && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-700 font-medium">
            <CheckCircle size={15} /> Bill Closed
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function OrderMonitor() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter]   = useState('All')

  // ── Fetch all open orders ──────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setOrders(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ── Update status field ────────────────────────────────────
  async function handleStatusChange(id, field, value) {
    setUpdating(id)
    await supabase.from('orders').update({ [field]: value }).eq('id', id)
    setUpdating(null)
  }

  // ── Confirm payment & close bill ───────────────────────────
  async function handleCloseBill(id) {
    setUpdating(id)
    const order = orders.find(o => o.id === id)
    if (order) {
      // Archive to history before deleting
      await supabase.from('order_history').insert([{
        order_id:       order.id,
        table_number:   order.table_number,
        items:          order.items,
        total_price:    order.total_price,
        status:         'Served',
        payment_status: 'Paid',
        notes:          order.notes ?? null,
        created_at:     order.created_at,
        closed_at:      new Date().toISOString(),
      }])
    }
    // Delete from active orders
    await supabase.from('orders').delete().eq('id', id)
    setUpdating(null)
  }

  // ── Filtered orders ────────────────────────────────────────
  const STATUS_FILTERS = ['All', ...ORDER_STATUSES, 'Payment Requested']
  const filtered = orders.filter(o => {
    if (filter === 'All') return true
    if (filter === 'Payment Requested') return o.payment_status === 'Requested'
    return o.status === filter
  })

  // ── Summary counts ─────────────────────────────────────────
  const counts = {
    All:               orders.length,
    Pending:           orders.filter(o => o.status === 'Pending').length,
    Cooking:           orders.filter(o => o.status === 'Cooking').length,
    Served:            orders.filter(o => o.status === 'Served').length,
    'Payment Requested': orders.filter(o => o.payment_status === 'Requested').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Order Monitor</h2>
          <p className="page-subtitle">Live view of all active orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary self-start">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-terracotta-500 text-white'
                : 'bg-white border border-cream-300 text-slate-600 hover:bg-cream-100'
            }`}
          >
            {f}
            <span className={`
              inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold
              ${filter === f ? 'bg-white/30 text-white' : 'bg-cream-200 text-slate-600'}
            `}>
              {counts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Order grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ClipboardList size={48} className="mb-4 opacity-40" />
          <p className="font-medium text-base">No orders</p>
          <p className="text-sm mt-1 text-slate-400">
            {filter === 'All' ? 'All tables are currently free.' : `No orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onCloseBill={handleCloseBill}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  )
}
