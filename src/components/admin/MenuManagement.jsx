import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../utils/format'
import {
  Plus, Pencil, Trash2, Search, X, Check,
  UtensilsCrossed, AlertCircle, Loader2, ImagePlus, Image,
} from 'lucide-react'

const CATEGORIES = ['Food', 'Drink', 'Dessert']
const BUCKET = 'menu-images'

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Food',
  price: '',
  is_available: true,
  image_url: '',
}

// ── Upload image to Supabase Storage ────────────────────────
async function uploadImage(file) {
  const ext      = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

// ── Delete image from Supabase Storage ──────────────────────
async function deleteImage(url) {
  if (!url) return
  try {
    // Extract the filename from the full public URL
    const parts = url.split(`/${BUCKET}/`)
    if (parts.length < 2) return
    await supabase.storage.from(BUCKET).remove([parts[1]])
  } catch (_) {
    // Non-fatal — just log silently
  }
}

// ── Reusable modal wrapper ──────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <h2 className="font-serif text-lg font-semibold text-terracotta-700">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-200 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Image upload field ───────────────────────────────────────
function ImageUploadField({ currentUrl, onUrlChange, uploading, setUploading }) {
  const fileRef  = useRef(null)
  const [preview, setPreview] = useState(currentUrl || '')
  const [uploadError, setUploadError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type and size (max 2MB)
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran gambar maksimal 2MB.')
      return
    }

    setUploadError(null)
    setUploading(true)
    // Show local preview immediately
    setPreview(URL.createObjectURL(file))

    try {
      const url = await uploadImage(file)
      setPreview(url)
      onUrlChange(url)
    } catch (err) {
      setUploadError(err.message)
      setPreview(currentUrl || '')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview('')
    onUrlChange('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <label className="label">Foto Menu</label>

      {preview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-cream-300 group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 hover:bg-cream-100"
            >
              <ImagePlus size={14} /> Ganti
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-lg text-xs font-medium text-white hover:bg-red-700"
            >
              <X size={14} /> Hapus
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 rounded-xl border-2 border-dashed border-cream-400 hover:border-terracotta-400 hover:bg-cream-50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-terracotta-500"
        >
          {uploading
            ? <Loader2 size={24} className="animate-spin" />
            : <Image size={24} />
          }
          <span className="text-xs font-medium">
            {uploading ? 'Mengupload…' : 'Klik untuk upload gambar'}
          </span>
          <span className="text-[10px] text-slate-400">PNG, JPG, WEBP · maks 2MB</span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}
    </div>
  )
}

// ── Menu form (create / edit) ────────────────────────────────
function MenuForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm]         = useState(initial ?? EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [uploading, setUploading] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())              e.name  = 'Name is required.'
    if (!form.price || form.price <= 0) e.price = 'Price must be greater than 0.'
    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, price: parseFloat(form.price) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload */}
      <ImageUploadField
        currentUrl={form.image_url}
        onUrlChange={url => set('image_url', url)}
        uploading={uploading}
        setUploading={setUploading}
      />

      {/* Name */}
      <div>
        <label className="label">Item Name *</label>
        <input
          className={`input ${errors.name ? 'border-red-400' : ''}`}
          placeholder="e.g. Nasi Goreng Kampung"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Short description of the item…"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Category + Price row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select
            className="input"
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Price (Rp) *</label>
          <input
            type="number"
            min="0"
            step="500"
            className={`input ${errors.price ? 'border-red-400' : ''}`}
            placeholder="45000"
            value={form.price}
            onChange={e => set('price', e.target.value)}
          />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.is_available}
          onClick={() => set('is_available', !form.is_available)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${form.is_available ? 'bg-terracotta-500' : 'bg-slate-300'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${form.is_available ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        <span className="text-sm text-slate-600">
          {form.is_available ? 'Available (in stock)' : 'Unavailable (out of stock)'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading || uploading} className="btn-primary">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {initial ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </form>
  )
}

// ── Delete confirmation modal ────────────────────────────────
function DeleteConfirm({ item, onConfirm, onCancel, loading }) {
  return (
    <Modal title="Delete Menu Item" onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            Are you sure you want to delete <strong>"{item.name}"</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Category badge ───────────────────────────────────────────
const CATEGORY_COLORS = {
  Food:    'bg-orange-100 text-orange-700',
  Drink:   'bg-blue-100 text-blue-700',
  Dessert: 'bg-pink-100 text-pink-700',
}
function CategoryBadge({ category }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600'}`}>
      {category}
    </span>
  )
}

// ── Menu image thumbnail ─────────────────────────────────────
function MenuThumbnail({ url, name }) {
  if (!url) {
    return (
      <div className="w-10 h-10 rounded-lg bg-cream-200 flex items-center justify-center flex-shrink-0">
        <UtensilsCrossed size={16} className="text-slate-400" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={name}
      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-cream-300"
    />
  )
}

// ── Main component ───────────────────────────────────────────
export default function MenuManagement() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [modal, setModal]         = useState(null) // 'create' | 'edit' | 'delete'
  const [selected, setSelected]   = useState(null)

  // ── Fetch ──────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('menus')
      .select('*')
      .order('category')
      .order('name')
    if (err) setError(err.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Create ─────────────────────────────────────────────────
  async function handleCreate(form) {
    setSaving(true)
    const { error: err } = await supabase.from('menus').insert([form])
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    fetchItems()
  }

  // ── Update ─────────────────────────────────────────────────
  async function handleUpdate(form) {
    setSaving(true)
    // If image was removed or replaced, delete old image from storage
    if (selected.image_url && selected.image_url !== form.image_url) {
      await deleteImage(selected.image_url)
    }
    const { error: err } = await supabase
      .from('menus')
      .update(form)
      .eq('id', selected.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    setSelected(null)
    fetchItems()
  }

  // ── Delete ─────────────────────────────────────────────────
  async function handleDelete() {
    setSaving(true)
    // Delete image from storage first
    if (selected.image_url) await deleteImage(selected.image_url)
    const { error: err } = await supabase
      .from('menus')
      .delete()
      .eq('id', selected.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null)
    setSelected(null)
    fetchItems()
  }

  // ── Toggle availability ────────────────────────────────────
  async function toggleAvailable(item) {
    await supabase
      .from('menus')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    fetchItems()
  }

  // ── Filtered list ──────────────────────────────────────────
  const filtered = items.filter(it => {
    const matchCat    = filterCat === 'All' || it.category === filterCat
    const matchSearch = it.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Menu Management</h2>
          <p className="page-subtitle">{items.length} items in total</p>
        </div>
        <button
          className="btn-primary self-start"
          onClick={() => setModal('create')}
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search menu items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...CATEGORIES].map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterCat === c
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-cream-100 text-slate-600 hover:bg-cream-200 border border-cream-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading menu…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UtensilsCrossed size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <MenuThumbnail url={item.image_url} name={item.name} />
                    </td>
                    <td className="font-medium text-slate-800">{item.name}</td>
                    <td><CategoryBadge category={item.category} /></td>
                    <td className="font-semibold text-terracotta-600">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="max-w-xs truncate text-slate-500 text-xs">
                      {item.description || '–'}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleAvailable(item)}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${item.is_available ? 'bg-terracotta-500' : 'bg-slate-300'}
                        `}
                        title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                      >
                        <span
                          className={`
                            inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                            ${item.is_available ? 'translate-x-4' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelected(item); setModal('edit') }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-cream-200 hover:text-terracotta-600"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => { setSelected(item); setModal('delete') }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <Modal title="Add Menu Item" onClose={() => setModal(null)}>
          <MenuForm
            onSave={handleCreate}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {modal === 'edit' && selected && (
        <Modal title="Edit Menu Item" onClose={() => { setModal(null); setSelected(null) }}>
          <MenuForm
            initial={selected}
            onSave={handleUpdate}
            onCancel={() => { setModal(null); setSelected(null) }}
            loading={saving}
          />
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <DeleteConfirm
          item={selected}
          onConfirm={handleDelete}
          onCancel={() => { setModal(null); setSelected(null) }}
          loading={saving}
        />
      )}
    </div>
  )
}
