import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import { formatPrice } from '../utils/price'
import { useCart } from '../context/CartContext'

// Preço escondido por padrão, revelado ao passar o mouse — pedido
// explícito do cliente (diferente do site real, que sempre mostra o
// preço; essa escolha é deliberada, não uma cópia do site atual).
function ProductCard({ product, onAddToCart }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200">
      <Link to={`/produto/${product.id}`} className="block aspect-square overflow-hidden bg-gray-100">
        <img
          src={`${API_URL}${product.image_url}`}
          alt={product.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/produto/${product.id}`} className="text-sm font-medium text-gray-900 hover:underline">
          {product.name}
        </Link>

        <div className="relative h-6">
          <span className="absolute inset-0 flex items-center text-sm font-semibold text-gray-900 opacity-0 transition group-hover:opacity-100">
            {formatPrice(product.price_cents)}
          </span>
          <span className="absolute inset-0 flex items-center text-xs text-gray-400 transition group-hover:opacity-0">
            Passe o mouse para ver o preço
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(product)}
          className="mt-auto rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-500"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  )
}

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
