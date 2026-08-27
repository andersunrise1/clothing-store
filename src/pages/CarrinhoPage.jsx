import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import { formatPrice } from '../utils/price'
import { useCart } from '../context/CartContext'

function CarrinhoPage() {
  const { items, removeItem, setQuantity, totalCents } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Carrinho</h1>
        <p className="mt-2 text-gray-500">Seu carrinho está vazio.</p>
        <Link to="/loja" className="mt-4 inline-block text-sm text-purple-600 hover:underline">
          Ir para a loja
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Carrinho</h1>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 rounded border border-gray-200 p-3">
            <img
              src={`${API_URL}${item.image_url}`}
              alt={item.name}
              className="h-16 w-16 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-500">{formatPrice(item.price_cents)}</p>
            </div>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
              aria-label={`Quantidade de ${item.name}`}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-sm text-red-500 hover:underline"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-lg font-semibold text-gray-900">Total</span>
        <span className="text-lg font-semibold text-gray-900">{formatPrice(totalCents)}</span>
      </div>

      <Link
        to="/checkout"
        className="mt-4 block w-full rounded bg-purple-600 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-purple-500"
      >
        Finalizar compra
      </Link>
    </div>
  )
}

export default CarrinhoPage
