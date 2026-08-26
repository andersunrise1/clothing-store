import { useEffect, useState } from 'react'
import UploadCropModal from '../components/UploadCropModal'
import { ASPECT_RATIOS } from '../data/outfitOptions'

// Same backend the rest of the app will eventually talk to — see
// .claude/skills/outfitmixer-backend-ecommerce for why this is a separate
// Node/Express/SQLite server (server/) rather than folded into the Vite
// frontend. No env-based config yet since there's only ever one backend
// URL during local dev; revisit once a real deploy target exists.
const API_URL = 'http://localhost:4000'

const CATEGORY_OPTIONS = [
  'Skateboard',
  'Proteção',
  'Roupas',
  'Bags',
  'Livros, Zines & Arte',
  'Cartão Presente',
]

const MIXER_CATEGORY_LABELS = { shirt: 'Camiseta', pants: 'Calça / Bermuda' }

function formatPrice(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao entrar')
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-3 py-16">
      <h1 className="text-center text-2xl font-bold text-gray-900">Admin</h1>
      <input
        type="text"
        placeholder="Usuário"
        aria-label="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="Senha"
        aria-label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

function ProductForm({ token, onCreated }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)

  const [useInMixer, setUseInMixer] = useState(false)
  const [mixerCategory, setMixerCategory] = useState('shirt')
  const [mixerCroppedImage, setMixerCroppedImage] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
    // A new photo invalidates any crop already made against the old one.
    setMixerCroppedImage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!photoFile) {
      setError('Escolha uma foto do produto')
      return
    }
    if (useInMixer && !mixerCroppedImage) {
      setError('Ajuste o corte para o Outfit Mixer antes de salvar (ou desmarque a opção)')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('price', price)
      formData.append('category', category)
      formData.append('image', photoFile)
      if (useInMixer) {
        formData.append('outfitMixerCategory', mixerCategory)
        formData.append('outfitMixerImage', mixerCroppedImage)
      }

      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar produto')

      onCreated(data)
      setName('')
      setPrice('')
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      setUseInMixer(false)
      setMixerCroppedImage(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Adicionar produto</h2>

        <input
          type="text"
          placeholder="Nome do produto"
          aria-label="Nome do produto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Preço (R$)"
            aria-label="Preço"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-32 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Categoria"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <label className="text-sm text-gray-600">
          Foto do produto
          <input
            type="file"
            accept="image/*"
            aria-label="Foto do produto"
            onChange={handlePhotoChange}
            className="mt-1 block text-sm"
          />
        </label>

        {photoPreviewUrl && (
          <img src={photoPreviewUrl} alt="Pré-visualização" className="h-32 w-32 rounded object-cover" />
        )}

        {photoFile && (
          <div className="rounded border border-purple-200 bg-purple-50 p-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={useInMixer}
                onChange={(e) => setUseInMixer(e.target.checked)}
              />
              Usar também no Outfit Mixer?
            </label>

            {useInMixer && (
              <div className="mt-2 flex items-center gap-3">
                <select
                  value={mixerCategory}
                  onChange={(e) => {
                    setMixerCategory(e.target.value)
                    setMixerCroppedImage(null)
                  }}
                  aria-label="Categoria no Outfit Mixer"
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="shirt">Camiseta</option>
                  <option value="pants">Calça / Bermuda</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  className="rounded border border-purple-400 px-3 py-1 text-sm text-purple-600 transition hover:bg-purple-100"
                >
                  {mixerCroppedImage ? 'Ajustar corte de novo' : 'Ajustar corte'}
                </button>
                {mixerCroppedImage && (
                  <img
                    src={mixerCroppedImage}
                    alt="Corte para o Outfit Mixer"
                    className="h-12 w-12 rounded border border-purple-300 object-cover"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting ? 'Salvando...' : 'Salvar produto'}
        </button>
      </form>

      {showCropModal && (
        <UploadCropModal
          title={MIXER_CATEGORY_LABELS[mixerCategory]}
          aspect={ASPECT_RATIOS[mixerCategory]}
          editingItem={{ originalSrc: photoPreviewUrl }}
          onSave={({ image }) => {
            setMixerCroppedImage(image)
            setShowCropModal(false)
          }}
          onClose={() => setShowCropModal(false)}
        />
      )}
    </>
  )
}

function ProductList({ token, products, onDeleted }) {
  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onDeleted(id)
  }

  if (products.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum produto cadastrado ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded border border-gray-200 p-3"
        >
          <img
            src={`${API_URL}${p.image_url}`}
            alt={p.name}
            className="h-12 w-12 rounded object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">
              {p.category} · {formatPrice(p.price_cents)}
              {p.outfit_mixer_category &&
                ` · também no Outfit Mixer (${MIXER_CATEGORY_LABELS[p.outfit_mixer_category]})`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(p.id)}
            className="text-sm text-red-500 hover:underline"
          >
            Excluir
          </button>
        </li>
      ))}
    </ul>
  )
}

function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('bc_admin_token'))
  const [products, setProducts] = useState([])

  const handleLogin = (newToken) => {
    localStorage.setItem('bc_admin_token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('bc_admin_token')
    setToken(null)
  }

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setProducts)
      .catch(() => handleLogout()) // token expired/invalid — back to login
  }, [token])

  if (!token) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <button type="button" onClick={handleLogout} className="text-sm text-gray-500 hover:underline">
          Sair
        </button>
      </div>

      <ProductForm token={token} onCreated={(p) => setProducts((prev) => [p, ...prev])} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Produtos cadastrados</h2>
        <ProductList
          token={token}
          products={products}
          onDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
        />
      </div>
    </div>
  )
}

export default AdminPage
