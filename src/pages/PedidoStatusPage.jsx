import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const STATUS_CONTENT = {
  sucesso: {
    title: 'Pagamento aprovado!',
    body: 'Seu pedido foi confirmado. Você vai receber os detalhes por e-mail.',
    tone: 'text-green-700',
  },
  pendente: {
    title: 'Pagamento em análise',
    body: 'Assim que o Mercado Pago confirmar, seu pedido é liberado automaticamente.',
    tone: 'text-amber-700',
  },
  erro: {
    title: 'Pagamento não aprovado',
    body: 'Algo deu errado ao processar o pagamento. Nada foi cobrado — tente novamente.',
    tone: 'text-red-700',
  },
}

// Where Mercado Pago's back_urls (server/src/routes/orders.js) send the
// buyer back to. The cart is only cleared on a real "sucesso" redirect —
// an abandoned/rejected/pending checkout should leave the cart exactly as
// the buyer left it, so they can just try paying again.
function PedidoStatusPage() {
  const { status } = useParams()
  const { clearCart } = useCart()
  const content = STATUS_CONTENT[status] ?? STATUS_CONTENT.erro

  // clearCart deliberately isn't in the dependency array — it's a new
  // function identity on every CartProvider render (it isn't memoized),
  // and depending on it would re-fire this effect every time the cart
  // changes (including from the clearCart() call itself), not just on the
  // one real trigger this needs: the buyer landing on this status page.
  useEffect(() => {
    if (status === 'sucesso') clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className={`text-2xl font-bold ${content.tone}`}>{content.title}</h1>
      <p className="mt-2 text-gray-600">{content.body}</p>
      <Link to="/loja" className="mt-6 inline-block text-sm text-purple-600 hover:underline">
        Voltar para a loja
      </Link>
    </div>
  )
}

export default PedidoStatusPage
