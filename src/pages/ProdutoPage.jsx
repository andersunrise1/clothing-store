import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '../config'
import { formatPrice } from '../utils/price'
import { useCart } from '../context/CartContext'

// Versão enxuta de propósito — sem avaliações, perguntas de clientes,
// calculadora de frete por CEP ou variantes, que o site real
// (boardculture.com.br) tem. Ver a skill outfitmixer-loja-skateboard e o
// artefato de auditoria: esses são recursos grandes por si só, adiados
// pra depois da Fase 3 (loja + carrinho básicos) de propósito.
function ProdutoPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    fetch(`${API_URL}/api/products/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setProduct)
      .catch(() => setNotFound(true))
  }, [id])

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addItem(product)
    setAdded(true)
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Produto não encontrado</h1>
        <Link to="/loja" className="mt-4 inline-block text-sm text-purple-600 hover:underline">
          Voltar para a loja
        </Link>
      </div>
    )
  }

  if (!product) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">Carregando...</p>
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 md:grid-cols-2">
      <img
        src={`${API_URL}${product.image_url}`}
        alt={product.name}
        className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
      />

      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{product.category}</p>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-2xl font-semibold text-gray-900">{formatPrice(product.price_cents)}</p>

        <div className="flex items-center gap-3">
          <label htmlFor="quantity" className="text-sm text-gray-600">
            Quantidade
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="self-start rounded bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500"
        >
          Adicionar ao carrinho
        </button>

        {added && (
          <p className="text-sm text-green-700">
            Adicionado!{' '}
            <Link to="/carrinho" className="underline">
              Ver carrinho
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default ProdutoPage
