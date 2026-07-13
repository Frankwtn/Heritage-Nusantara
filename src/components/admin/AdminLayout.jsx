import { useState } from 'react'
import {
  UtensilsCrossed,
  QrCode,
  ClipboardList,
  BarChart3,
  Menu,
  ChefHat,
  LogOut,
  KeyRound,
} from 'lucide-react'
import ChangePassword from './ChangePassword'

const NAV_ITEMS = [
  { id: 'orders',    label: 'Order Monitor',    icon: ClipboardList },
  { id: 'menu',      label: 'Menu Management',  icon: UtensilsCrossed },
  { id: 'tables',    label: 'Table & QR',       icon: QrCode },
  { id: 'reports',   label: 'Financial Report', icon: BarChart3 },
]

export default function AdminLayout({ activePage, onNavigate, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [changePwOpen, setChangePwOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen]     = useState(false)

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 flex flex-col
          bg-slate-900 text-white shadow-xl
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-700 bg-batik-pattern">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-terracotta-500 flex items-center justify-center flex-shrink-0">
              <ChefHat size={20} className="text-white" />
            </div>
            <div>
              <p className="font-serif font-semibold text-cream-100 leading-tight">
                Heritage Nusantara
              </p>
              <p className="text-[10px] text-gold-400 uppercase tracking-widest">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); setSidebarOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  font-medium transition-colors duration-150
                  ${active
                    ? 'bg-terracotta-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Sidebar footer — change password & logout */}
        <div className="px-3 py-4 border-t border-slate-700 space-y-1">
          <button
            onClick={() => { setChangePwOpen(true); setSidebarOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       font-medium text-slate-300 hover:bg-slate-800 hover:text-white
                       transition-colors duration-150"
          >
            <KeyRound size={18} className="flex-shrink-0" />
            Change Password
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       font-medium text-slate-300 hover:bg-red-900/50 hover:text-red-300
                       transition-colors duration-150"
          >
            <LogOut size={18} className="flex-shrink-0" />
            Sign Out
          </button>
          <p className="text-[10px] text-slate-600 text-center pt-2">
            "Timeless Flavors, Modern Convenience."
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-cream-300 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              {/* Hamburger (mobile) */}
              <button
                className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-cream-200"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <h1 className="font-serif text-lg font-semibold text-terracotta-700">
                {NAV_ITEMS.find(n => n.id === activePage)?.label ?? 'Dashboard'}
              </h1>
            </div>

            {/* Right side — user menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(p => !p)}
                className="flex items-center gap-2 text-xs text-slate-600 bg-cream-100
                           px-3 py-1.5 rounded-full border border-cream-300
                           hover:bg-cream-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-terracotta-500 flex items-center justify-center">
                  <ChefHat size={11} className="text-white" />
                </div>
                <span className="font-medium">Admin</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-cream-200 py-1 w-44">
                    <button
                      onClick={() => { setChangePwOpen(true); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700
                                 hover:bg-cream-100 transition-colors"
                    >
                      <KeyRound size={15} className="text-slate-400" /> Change Password
                    </button>
                    <div className="border-t border-cream-200 my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); onLogout() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600
                                 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Change password modal */}
      {changePwOpen && <ChangePassword onClose={() => setChangePwOpen(false)} />}
    </div>
  )
}
