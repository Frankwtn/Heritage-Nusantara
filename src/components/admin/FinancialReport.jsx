import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRupiah, formatDate } from '../../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  TrendingUp, Calendar, Clock, Loader2,
  AlertCircle, X, ReceiptText, RefreshCw,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function toWIBDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}
function toWIBHour(isoString) {
  return new Date(isoString).toLocaleString('id-ID', {
    hour: '2-digit', hour12: false, timeZone: 'Asia/Jakarta',
  })
}

// ── Custom tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-cream-300 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-terracotta-600 font-bold">{formatRupiah(payload[0].value)}</p>
      <p className="text-slate-400 text-xs">{payload[0].payload.count} transaction(s)</p>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'terracotta' }) {
  const colorMap = {
    terracotta: 'bg-terracotta-50 text-terracotta-600 border-terracotta-200',
    gold:       'bg-amber-50 text-amber-600 border-amber-200',
    blue:       'bg-blue-50 text-blue-600 border-blue-200',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function FinancialReport() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [range, setRange]       = useState('weekly') // 'daily' | 'weekly'

  // Fetch from order_history (completed/paid orders)
  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('order_history')
      .select('*')
      .order('closed_at', { ascending: false })
    if (err) setError(err.message)
    else setHistory(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // ── Derived stats ──────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  // Use closed_at as the reference timestamp
  const todayOrders   = history.filter(o => toWIBDate(o.closed_at) === today)
  const todayRevenue  = todayOrders.reduce((s, o) => s + Number(o.total_price), 0)
  const totalRevenue  = history.reduce((s, o) => s + Number(o.total_price), 0)

  // Peak hour — based on closed_at today
  const hourCounts = todayOrders.reduce((acc, o) => {
    const h = toWIBHour(o.closed_at)
    acc[h] = (acc[h] ?? 0) + 1
    return acc
  }, {})
  const peakEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
  const peakHour  = peakEntry?.[0]

  // ── Chart data ─────────────────────────────────────────────
  function buildChartData() {
    const now = new Date()

    if (range === 'daily') {
      // Hourly breakdown for today (08:00–23:00)
      const hourly = []
      for (let h = 8; h <= 23; h++) {
        const hStr   = String(h).padStart(2, '0')
        const hOrders = todayOrders.filter(o => toWIBHour(o.closed_at) === hStr)
        hourly.push({
          label:   `${hStr}:00`,
          revenue: hOrders.reduce((s, o) => s + Number(o.total_price), 0),
          count:   hOrders.length,
        })
      }
      return hourly
    }

    // Last 7 days
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr  = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      const label    = i === 0
        ? 'Today'
        : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
      const dayOrders = history.filter(o => toWIBDate(o.closed_at) === dateStr)
      result.push({
        label,
        revenue: dayOrders.reduce((s, o) => s + Number(o.total_price), 0),
        count:   dayOrders.length,
      })
    }
    return result
  }

  const chartData  = buildChartData()
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Financial Report</h2>
          <p className="page-subtitle">Revenue overview from closed bills</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button onClick={fetchHistory} className="btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
          {(['daily', 'weekly']).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-terracotta-500 text-white'
                  : 'bg-white border border-cream-300 text-slate-600 hover:bg-cream-100'
              }`}
            >
              {r === 'daily' ? 'Today (Hourly)' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading report…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Today's Revenue"
              value={formatRupiah(todayRevenue)}
              sub={`${todayOrders.length} order(s) closed today`}
              color="terracotta"
            />
            <StatCard
              icon={Calendar}
              label="Total Revenue (All Time)"
              value={formatRupiah(totalRevenue)}
              sub={`${history.length} total order(s)`}
              color="gold"
            />
            <StatCard
              icon={Clock}
              label="Peak Hour (Today)"
              value={peakHour ? `${peakHour}:00` : '–'}
              sub={peakHour
                ? `${hourCounts[peakHour]} order(s) closed`
                : 'No closed bills today'}
              color="blue"
            />
          </div>

          {/* Bar chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-700 text-sm">
                {range === 'daily' ? 'Revenue by Hour – Today' : 'Revenue Trend – Last 7 Days'}
              </h3>
            </div>
            <div className="card-body">
              {chartData.every(d => d.revenue === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ReceiptText size={36} className="mb-3 opacity-40" />
                  <p className="text-sm">No revenue data for this period.</p>
                  <p className="text-xs mt-1 text-slate-400">Close a bill to record revenue.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5e6cb" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fdf3ef' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={52}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.revenue === maxRevenue && entry.revenue > 0
                            ? '#c0522a'
                            : '#f09c75'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Transaction history table */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="font-semibold text-slate-700 text-sm">Transaction History</h3>
              <span className="text-xs text-slate-400">{history.length} record(s)</span>
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <ReceiptText size={36} className="mb-3 opacity-40" />
                <p className="text-sm">No transactions recorded yet.</p>
                <p className="text-xs mt-1">Closed bills will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Closed At</th>
                      <th>Day</th>
                      <th>Table</th>
                      <th>Items</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(record => {
                      const d = new Date(record.closed_at)
                      const dayName = d.toLocaleDateString('en-US', {
                        weekday: 'long', timeZone: 'Asia/Jakarta',
                      })
                      return (
                        <tr key={record.id}>
                          <td className="whitespace-nowrap">{formatDate(record.closed_at)}</td>
                          <td>{dayName}</td>
                          <td>Table {record.table_number}</td>
                          <td className="text-xs text-slate-500 max-w-xs truncate">
                            {Array.isArray(record.items)
                              ? record.items.map(i => `${i.qty}× ${i.name}`).join(', ')
                              : '–'}
                          </td>
                          <td className="text-right font-semibold text-terracotta-600">
                            {formatRupiah(record.total_price)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
