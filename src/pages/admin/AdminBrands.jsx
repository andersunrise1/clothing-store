import { useEffect, useState } from 'react'
import { API_URL } from '../../config'

function BrandForm({ token, onCreated }) {
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nome da marca é obrigatório')
      return
    }
    if (!logoFile) {
      setError('Escolha o logo da marca')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('logo', logoFile)

      const res = await fetch(`${API_URL}/api/admin/brands`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar marca')

      onCreated(data)
      setName('')
      setLogoFile(null)
      setLogoPreviewUrl(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900">Adicionar marca</h2>

      <input
        type="text"
        placeholder="Nome da marca"
        aria-label="Nome da marca"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />

      <label className="text-sm text-gray-600">
        Logo (fundo transparente funciona melhor)
        <input
          type="file"
          accept="image/*"
          aria-label="Logo da marca"
          onChange={handleLogoChange}
          className="mt-1 block text-sm"
        />
      </label>

      {logoPreviewUrl && (
        <img src={logoPreviewUrl} alt="Pré-visualização" className="h-16 w-32 rounded border border-gray-100 object-contain" />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {submitting ? 'Salvando...' : 'Salvar marca'}
      </button>
    </form>
  )
}

function BrandGrid({ token, brands, onDeleted }) {
  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/admin/brands/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onDeleted(id)
  }

  if (brands.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma marca cadastrada ainda.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {brands.map((brand) => (
        <div
          key={brand.id}
          className="group relative flex h-20 items-center justify-center overflow-hidden rounded border border-gray-200 p-2"
        >
          <img
            src={`${API_URL}${brand.logo_url}`}
            alt={brand.name}
            className="max-h-full w-auto object-contain"
          />
          <button
            type="button"
            onClick={() => handleDelete(brand.id)}
            aria-label={`Excluir marca ${brand.name}`}
            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-red-500 opacity-0 shadow ring-1 ring-red-200 transition group-hover:opacity-100 hover:bg-red-500 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

function AdminBrands({ token, onAuthError }) {
  const [brands, setBrands] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/admin/brands`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setBrands)
      .catch(() => onAuthError())
  }, [token, onAuthError])

  return (
    <div className="flex flex-col gap-8">
      <BrandForm token={token} onCreated={(b) => setBrands((prev) => [b, ...prev])} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Marcas cadastradas</h2>
        <BrandGrid
          token={token}
          brands={brands}
          onDeleted={(id) => setBrands((prev) => prev.filter((b) => b.id !== id))}
        />
      </div>
    </div>
  )
}

export default AdminBrands
