import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_URL } from '../config'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

function LojaPage() {
  const [searchParams] = useSearchParams()
  const brandId = searchParams.get('marca')

  const [products, setProducts] = useState([])
  const [brand, setBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addItem } = useCart()

  useEffect(() => {
    const productsUrl = brandId
      ? `${API_URL}/api/products?brandId=${brandId}`
      : `${API_URL}/api/products`

    fetch(productsUrl)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setProducts)
      .catch(() => setError('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false))

    // Just for the "Marca: X" heading — the filtering itself already
    // happened server-side via brandId above.
    const brandLookup = brandId
      ? fetch(`${API_URL}/api/brands`)
          .then((res) => (res.ok ? res.json() : Promise.reject(res)))
          .then((brands) => brands.find((b) => String(b.id) === brandId) ?? null)
          .catch(() => null)
      : Promise.resolve(null)

    brandLookup.then(setBrand)
  }, [brandId])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {brandId ? `Loja — ${brand?.name ?? 'marca'}` : 'Loja'}
        </h1>
        {brandId && (
          <Link to="/loja" className="text-sm text-purple-600 hover:underline">
            Ver todas as marcas
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Carregando produtos...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-sm text-gray-500">
          {brandId
            ? 'Nenhum produto dessa marca cadastrado ainda.'
            : 'Nenhum produto cadastrado ainda — assim que o admin subir produtos, eles aparecem aqui.'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addItem} />
        ))}
      </div>
    </div>
  )
}

export default LojaPage
