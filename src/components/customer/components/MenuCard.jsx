import { Plus, Minus, UtensilsCrossed } from 'lucide-react'
import { formatRupiah } from '../../../utils/format'
import QtyButton from './QtyButton'

export default function MenuCard({ item, qty, onAdd, onRemove, onPreview }) {
  const unavailable = !item.is_available

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all
      ${unavailable ? 'opacity-60 border-cream-300' : 'border-cream-300 hover:shadow-md'}`}>

      {/* Image — tap to preview */}
      <button
        type="button"
        onClick={onPreview}
        className="relative w-full h-40 bg-cream-100 overflow-hidden block focus:outline-none"
      >
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
        {/* Preview hint overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-end justify-end p-2">
          <span className="bg-black/40 text-white text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100">
            View
          </span>
        </div>
        {unavailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4">
        {/* Name — tap to preview */}
        <button
          type="button"
          onClick={onPreview}
          className="text-left w-full focus:outline-none"
        >
          <p className="font-semibold text-slate-800 text-sm leading-tight hover:text-terracotta-600 transition-colors">
            {item.name}
          </p>
        </button>
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
