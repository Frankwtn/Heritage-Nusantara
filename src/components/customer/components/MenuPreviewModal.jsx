import { Plus, Minus, X, UtensilsCrossed } from 'lucide-react'
import { formatRupiah } from '../../../utils/format'
import QtyButton from './QtyButton'

export default function MenuPreviewModal({ item, qty, onAdd, onRemove, onClose }) {
  const unavailable = !item.is_available

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden
                      animate-slide-in-right sm:animate-none">
        {/* Image */}
        <div className="relative w-full h-64 bg-cream-100">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-cream-400">
              <UtensilsCrossed size={48} />
              <span className="text-sm">No image</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60
                       flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Category badge */}
          {item.category && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold
                             bg-white/90 text-slate-700 shadow-sm">
              {item.category}
            </span>
          )}

          {unavailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white/90 text-slate-700 text-sm font-semibold px-4 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-5 py-5 space-y-3">
          <div>
            <h3 className="font-serif font-bold text-xl text-slate-800 leading-tight">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{item.description}</p>
            )}
          </div>

          <p className="font-bold text-terracotta-600 text-2xl">{formatRupiah(item.price)}</p>

          {/* Cart controls */}
          <div className="flex items-center gap-3 pt-1">
            {qty > 0 ? (
              <>
                <div className="flex items-center gap-3 flex-1">
                  <QtyButton onClick={onRemove} disabled={unavailable}>
                    <Minus size={14} />
                  </QtyButton>
                  <span className="w-8 text-center font-bold text-slate-800 text-lg">{qty}</span>
                  <QtyButton onClick={onAdd} disabled={unavailable}>
                    <Plus size={14} />
                  </QtyButton>
                </div>
                <span className="text-sm font-bold text-terracotta-600">
                  {formatRupiah(item.price * qty)}
                </span>
              </>
            ) : (
              <button
                onClick={onAdd}
                disabled={unavailable}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-terracotta-500 text-white font-semibold text-sm
                           hover:bg-terracotta-600 active:scale-[0.98] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
