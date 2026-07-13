/**
 * Format a number as Indonesian Rupiah.
 * e.g. 45000 → "Rp 45.000"
 */
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date string or Date object as a readable Indonesian date.
 * e.g. "2024-06-15T10:30:00Z" → "15 Jun 2024, 17:30"
 */
export function formatDate(dateInput) {
  const d = new Date(dateInput)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

/**
 * Format a date to just the day name (Senin, Selasa, …)
 */
export function formatDayName(dateInput) {
  const d = new Date(dateInput)
  return d.toLocaleString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' })
}

/**
 * Return today's date as YYYY-MM-DD in WIB.
 */
export function todayWIB() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}
