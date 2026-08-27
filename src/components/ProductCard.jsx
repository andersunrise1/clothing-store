import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import { formatPrice } from '../utils/price'

// Preço escondido por padrão, revelado ao passar o mouse — pedido
// explícito do cliente (diferente do site real, que sempre mostra o
// preço; essa escolha é deliberada, não uma cópia do site atual). O
// painel de quantidade + "+ Carrinho" que aparece sobre a foto no hover,
// por outro lado, é reproduzindo o comportamento real do site — sem o
// dropdown de "opções" (variante/tamanho) porque o catálogo ainda não tem
// esse dado no schema; adicionar isso sem dado real por trás seria só
// enfeite que não funciona.
function ProductCard({ product, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Link to={`/produto/${product.id}`} className="block h-full w-full">
          <img
            src={`${API_URL}${product.image_url}`}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </Link>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-white/95 p-2 opacity-0 transition group-hover:opacity-100">
          <div className="flex items-center rounded border border-gray-300">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              −
            </button>
            <span className="w-6 text-center text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
              className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(product, quantity)}
            className="rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-500"
          >
            + Carrinho
          </button>
        </div>
      </div>

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
      </div>
    </div>
  )
}

export default ProductCard
