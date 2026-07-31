export default function QtyButton({ onClick, disabled, children }) {
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
