import { useEffect, useState } from 'react'
import { API_URL } from '../../config'
import { formatPrice } from '../../utils/price'

const STATUS_LABELS = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Pago', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeitado', className: 'bg-red-100 text-red-700' },
}

// Read-only — status comes entirely from the real Mercado Pago webhook
// (server/src/routes/paymentWebhook.js), not something an admin sets by
// hand. This is purely "what got ordered, by whom, was it paid" so the
// shop owner knows what to ship.
function AdminOrders({ token, onAuthError }) {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setOrders)
      .catch(() => onAuthError())
  }, [token, onAuthError])

  if (orders.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum pedido ainda.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => {
        const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending
        return (
          <div key={order.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Pedido #{order.id} — {order.customer_name}
                </p>
                <p className="text-xs text-gray-500">
                  {order.customer_email} · {order.customer_phone}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                {status.label}
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">Endereço: {order.shipping_address}</p>

            <ul className="mt-3 flex flex-col gap-1">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm text-gray-700">
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span>{formatPrice(item.unit_price_cents * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminOrders
