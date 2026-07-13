import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import {
  Plus, Trash2, QrCode, Printer, X,
  AlertCircle, Loader2, Table2,
} from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin

// ── QR Print View ─────────────────────────────────────────────
function QRPrintModal({ table, onClose }) {
  const url = `${APP_URL}/menu?table=${table.table_number}`
  const printRef = useRef(null)

  function handlePrint() {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=480,height=640')
    win.document.write(`
      <!doctype html><html><head>
        <meta charset="UTF-8"/>
        <title>QR Code – Table ${table.table_number}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Georgia, serif;
            display: flex; align-items: center;
            justify-content: center; min-height: 100vh;
            background: #fdf8f0;
          }
          .wrap {
            border: 2px solid #c0522a; border-radius: 16px;
            padding: 36px 40px; text-align: center;
            background: #fff; max-width: 380px; width: 100%;
          }
          .brand { font-size: 22px; font-weight: 700; color: #c0522a; letter-spacing: 0.02em; }
          .tagline { font-size: 11px; color: #9a7520; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 2px; }
          .divider { border: none; border-top: 1px solid #f5e6cb; margin: 18px 0; }
          .table-label { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
          .table-num { font-size: 48px; font-weight: 700; color: #1e2a38; line-height: 1; margin: 4px 0 16px; }
          svg { display: block; margin: 0 auto; }
          .url { font-size: 9px; color: #9ca3af; margin-top: 14px; word-break: break-all; }
          .instruction { margin-top: 16px; font-size: 12px; color: #6b7280; }
        </style>
      </head><body><div class="wrap">
        <div class="brand">Heritage Nusantara</div>
        <div class="tagline">Timeless Flavors, Modern Convenience</div>
        <hr class="divider"/>
        <div class="table-label">Table</div>
        <div class="table-num">${table.table_number}</div>
        ${printRef.current.querySelector('svg').outerHTML}
        <div class="url">${url}</div>
        <div class="instruction">Scan to view our menu and place your order</div>
      </div></body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <h2 className="font-serif text-lg font-semibold text-terracotta-700">
            QR Code – Table {table.table_number}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* QR preview */}
        <div className="flex flex-col items-center gap-4 px-6 py-8 bg-cream-50" ref={printRef}>
          <div className="bg-white p-4 rounded-xl border-2 border-terracotta-200 shadow-sm">
            <QRCodeSVG
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#1e2a38"
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Table</p>
            <p className="font-serif text-4xl font-bold text-slate-800 leading-none mt-1">
              {table.table_number}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 break-all text-center max-w-xs">{url}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-cream-200">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button onClick={handlePrint} className="btn-primary flex-1">
            <Printer size={15} /> Print QR
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function TableManagement() {
  const [tables, setTables]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [newNum, setNewNum]     = useState('')
  const [qrTable, setQrTable]   = useState(null)
  const [deleting, setDeleting] = useState(null) // table id being deleted

  const fetchTables = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('tables')
      .select('*')
      .order('table_number')
    if (err) setError(err.message)
    else setTables(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTables() }, [fetchTables])

  async function addTable(e) {
    e.preventDefault()
    const num = parseInt(newNum, 10)
    if (!num || num < 1) { setError('Please enter a valid table number.'); return }
    if (tables.some(t => t.table_number === num)) {
      setError(`Table ${num} already exists.`); return
    }
    setSaving(true)
    const { error: err } = await supabase.from('tables').insert([{ table_number: num }])
    setSaving(false)
    if (err) { setError(err.message); return }
    setNewNum('')
    fetchTables()
  }

  async function deleteTable(table) {
    setDeleting(table.id)
    const { error: err } = await supabase.from('tables').delete().eq('id', table.id)
    setDeleting(null)
    if (err) { setError(err.message); return }
    fetchTables()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Table & QR Management</h2>
        <p className="page-subtitle">{tables.length} tables configured</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Add table form */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-700 text-sm">Add New Table</h3>
        </div>
        <div className="card-body">
          <form onSubmit={addTable} className="flex gap-3 items-end">
            <div className="w-48">
              <label className="label">Table Number</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="e.g. 10"
                value={newNum}
                onChange={e => setNewNum(e.target.value)}
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving
                ? <Loader2 size={16} className="animate-spin" />
                : <Plus size={16} />
              }
              Add Table
            </button>
          </form>
        </div>
      </div>

      {/* Tables grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading tables…
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Table2 size={40} className="mb-3 opacity-40" />
          <p className="font-medium">No tables yet</p>
          <p className="text-sm mt-1">Add your first table above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map(table => (
            <div
              key={table.id}
              className="card p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
            >
              {/* Table number */}
              <div className="w-14 h-14 rounded-full bg-terracotta-50 border-2 border-terracotta-200
                              flex items-center justify-center">
                <span className="font-serif text-2xl font-bold text-terracotta-600">
                  {table.table_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Table {table.table_number}</p>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setQrTable(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                             text-xs font-medium bg-terracotta-50 text-terracotta-700
                             hover:bg-terracotta-100 border border-terracotta-200 transition-colors"
                  title="View / Print QR"
                >
                  <QrCode size={13} /> QR
                </button>
                <button
                  onClick={() => deleteTable(table)}
                  disabled={deleting === table.id}
                  className="flex items-center justify-center p-1.5 rounded-lg text-slate-400
                             hover:bg-red-50 hover:text-red-600 border border-transparent
                             hover:border-red-200 transition-colors disabled:opacity-50"
                  title="Delete table"
                >
                  {deleting === table.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR modal */}
      {qrTable && (
        <QRPrintModal table={qrTable} onClose={() => setQrTable(null)} />
      )}
    </div>
  )
}
