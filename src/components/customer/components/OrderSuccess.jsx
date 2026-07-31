import { CheckCircle, ClipboardList } from 'lucide-react'

export default function OrderSuccess({ tableNumber, onOrderMore }) {
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
