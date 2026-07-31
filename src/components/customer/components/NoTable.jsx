import { AlertCircle } from 'lucide-react'

export default function NoTable() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <AlertCircle size={32} className="text-amber-500" />
        </div>
        <h2 className="font-serif text-xl font-bold text-slate-800">Invalid QR Code</h2>
        <p className="text-slate-500 text-sm">
          Please scan the QR code on your table to view the menu.
        </p>
      </div>
    </div>
  )
}
