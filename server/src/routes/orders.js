import { Router } from 'express'
import { Preference } from 'mercadopago'
import { db } from '../db.js'
import { mpClient, isMercadoPagoConfigured } from '../mercadoPagoConfig.js'

const router = Router()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

// Public — no customer accounts exist, contact/shipping info is collected
// fresh on every checkout (see src/pages/CheckoutPage.jsx).
router.post('/', async (req, res) => {
  // Checked first, before any validation or DB write — same order as every
  // other "external service not configured" gate in this project (AI/S3 in
  // the sibling project), so a real validation error is never masked by
  // this one, and vice versa.
  if (!isMercadoPagoConfigured()) {
    return res.status(503).json({ error: 'Pagamento (Mercado Pago) ainda não configurado.' })
  }

  const { customerName, customerEmail, customerPhone, shippingAddress, items } = req.body ?? {}

  if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
    return res.status(400).json({ error: 'Nome, e-mail, telefone e endereço são obrigatórios' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' })
  }

  // Never trust client-submitted prices — every item's real price/name is
  // looked up server-side from the product it references. A tampered
  // request (a fake low price_cents, say) can't change what actually gets
  // charged.
  const resolvedItems = []
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId)
    if (!product) {
      return res.status(400).json({ error: `Produto ${item.productId} não encontrado` })
    }
    const quantity = Math.max(1, Number(item.quantity) || 1)
    resolvedItems.push({ product, quantity })
  }

  const totalCents = resolvedItems.reduce(
    (sum, { product, quantity }) => sum + product.price_cents * quantity,
    0,
  )

  const orderResult = db
    .prepare(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, total_cents, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
    )
    .run(customerName, customerEmail, customerPhone, shippingAddress, totalCents)
  const orderId = orderResult.lastInsertRowid

  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity)
     VALUES (?, ?, ?, ?, ?)`,
  )
  for (const { product, quantity } of resolvedItems) {
    insertItem.run(orderId, product.id, product.name, product.price_cents, quantity)
  }

  // auto_return needs back_urls.success to be a real https:// URL — sending
  // it against a plain http://localhost URL makes preference creation fail
  // outright (confirmed behavior of the real Mercado Pago API, not
  // documentation guesswork). Local dev just skips it; production gets it
  // automatically once FRONTEND_URL is a real https domain.
  const isHttps = FRONTEND_URL.startsWith('https://')

  try {
    const preference = new Preference(mpClient)
    const result = await preference.create({
      body: {
        items: resolvedItems.map(({ product, quantity }) => ({
          id: String(product.id),
          title: product.name,
          quantity,
          currency_id: 'BRL',
          unit_price: product.price_cents / 100,
        })),
        payer: { name: customerName, email: customerEmail },
        external_reference: String(orderId),
        back_urls: {
          success: `${FRONTEND_URL}/pedido/sucesso`,
          failure: `${FRONTEND_URL}/pedido/erro`,
          pending: `${FRONTEND_URL}/pedido/pendente`,
        },
        ...(isHttps ? { auto_return: 'approved' } : {}),
        notification_url: `${BACKEND_URL}/api/payment/webhook`,
      },
    })

    db.prepare('UPDATE orders SET mp_preference_id = ? WHERE id = ?').run(result.id, orderId)

    res.status(201).json({ orderId, checkoutUrl: result.init_point })
  } catch (err) {
    console.error('Erro ao criar preferência do Mercado Pago:', err)
    // Roll back — a pending order nobody can ever pay for is just noise in
    // the admin's order list.
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId)
    db.prepare('DELETE FROM orders WHERE id = ?').run(orderId)
    res.status(502).json({ error: 'Erro ao iniciar pagamento. Tente novamente.' })
  }
})

export default router
