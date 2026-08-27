import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import { formatPrice } from '../utils/price'
import { useCart } from '../context/CartContext'

// No customer accounts exist, so contact/shipping info is collected fresh
// here every time — Mercado Pago Checkout Pro itself only handles payment,
// not "where do we ship this," so the shop needs this info before ever
// redirecting there.
function CheckoutPage() {
  const { items, totalCents } = useCart()
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-2 text-gray-500">Seu carrinho está vazio.</p>
        <Link to="/loja" className="mt-4 inline-block text-sm text-purple-600 hover:underline">
          Ir para a loja
        </Link>
      </div>
    )
  }

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao iniciar pagamento')

      // Real redirect to Mercado Pago's hosted checkout — the cart is
      // deliberately NOT cleared here; only /pedido/sucesso does that, once
      // Mercado Pago actually sends the buyer back as approved.
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Finalizar compra</h1>

      <div className="mb-6 rounded border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-xl font-semibold text-gray-900">{formatPrice(totalCents)}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Nome completo"
          aria-label="Nome completo"
          required
          value={form.customerName}
          onChange={handleChange('customerName')}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="E-mail"
          aria-label="E-mail"
          required
          value={form.customerEmail}
          onChange={handleChange('customerEmail')}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="tel"
          placeholder="Telefone / WhatsApp"
          aria-label="Telefone"
          required
          value={form.customerPhone}
          onChange={handleChange('customerPhone')}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Endereço de entrega completo"
          aria-label="Endereço de entrega"
          required
          rows={3}
          value={form.shippingAddress}
          onChange={handleChange('shippingAddress')}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting ? 'Redirecionando...' : 'Ir para pagamento'}
        </button>
      </form>
    </div>
  )
}

export default CheckoutPage
