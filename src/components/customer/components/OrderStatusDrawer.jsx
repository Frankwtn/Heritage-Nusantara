import { useState, useEffect, useCallback } from 'react'
import { X, ReceiptText, Loader2, ClipboardList, CreditCard, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatRupiah } from '../../../utils/format'
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../constants/orderConfig'

export default function OrderStatusDrawer({ tableNumber, onClose }) {
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

  const billableOrders   = orders.filter(o => o.payment_status === 'Unpaid' && o.status === 'Served')
  const hasRequestedBill = orders.some(o => o.payment_status === 'Requested')
  const allPaid          = orders.length > 0 && orders.every(o => o.payment_status === 'Paid')
  const grandTotal       = orders
    .filter(o => o.payment_status !== 'Paid')
    .reduce((sum, o) => sum + Number(o.total_price), 0)

  async function handleRequestBill() {
    if (billableOrders.length === 0) return
    setRequesting(true)
    await supabase
      .from('orders')
      .update({ payment_status: 'Requested' })
      .in('id', billableOrders.map(o => o.id))
    setRequesting(false)
    fetchOrders()
  }

  const showRequestBtn = billableOrders.length > 0 && !hasRequestedBill
  const showWaiting    = hasRequestedBill && !allPaid
  const showPaidMsg    = allPaid

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
              const sc = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.Pending
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

        {/* Footer */}
        {orders.length > 0 && (
          <div className="px-5 py-4 border-t border-cream-200 space-y-3 bg-white">
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
