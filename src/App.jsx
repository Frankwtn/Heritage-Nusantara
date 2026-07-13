import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './components/admin/AdminLogin'
import MenuManagement from './components/admin/MenuManagement'
import TableManagement from './components/admin/TableManagement'
import OrderMonitor from './components/admin/OrderMonitor'
import FinancialReport from './components/admin/FinancialReport'
import CustomerMenu from './components/customer/CustomerMenu'

// ── Admin shell with auth gate ────────────────────────────────
function AdminApp() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('hn_admin'))
  const [page, setPage]     = useState('orders')

  // Also listen for storage changes (logout from another tab)
  useEffect(() => {
    function onStorage() {
      setAuthed(!!sessionStorage.getItem('hn_admin'))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />
  }

  function handleLogout() {
    sessionStorage.removeItem('hn_admin')
    setAuthed(false)
  }

  const PAGES = {
    orders:  <OrderMonitor />,
    menu:    <MenuManagement />,
    tables:  <TableManagement />,
    reports: <FinancialReport />,
  }

  return (
    <AdminLayout activePage={page} onNavigate={setPage} onLogout={handleLogout}>
      {PAGES[page]}
    </AdminLayout>
  )
}

// ── Root router ───────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/*"   element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  )
}
