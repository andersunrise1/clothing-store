import { useEffect, useState } from 'react'
import { API_URL } from '../config'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

function LojaPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addItem } = useCart()

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setProducts)
      .catch(() => setError('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Loja</h1>

      {loading && <p className="text-sm text-gray-500">Carregando produtos...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhum produto cadastrado ainda — assim que o admin subir produtos, eles aparecem aqui.
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
