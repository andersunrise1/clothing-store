import { Router } from 'express'
import { Payment, WebhookSignatureValidator } from 'mercadopago'
import { db } from '../db.js'
import { mpClient, MERCADOPAGO_WEBHOOK_SECRET } from '../mercadoPagoConfig.js'

const router = Router()

// Mercado Pago notifies on every payment status transition (pending →
// approved/rejected, not just success), and retries aggressively on
// anything but a fast 2xx — every early return here still answers 200
// once we've decided there's nothing actionable, so a legitimate but
// uninteresting notification doesn't trigger a retry storm.
router.post('/webhook', async (req, res) => {
  // Fail closed: no secret configured means no notification can be trusted
  // as genuinely from Mercado Pago (vs. anyone POSTing a fake "approved"
  // straight to this URL) — reject rather than silently trust unsigned data.
  if (!MERCADOPAGO_WEBHOOK_SECRET) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook rejeitado por segurança.')
    return res.status(401).end()
  }

  const dataId = req.query['data.id'] ?? req.query.id ?? req.body?.data?.id

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers['x-signature'],
      xRequestId: req.headers['x-request-id'],
      dataId,
      secret: MERCADOPAGO_WEBHOOK_SECRET,
    })
  } catch (err) {
    console.error('Webhook do Mercado Pago com assinatura inválida:', err.message)
    return res.status(401).end()
  }

  const type = req.query.type ?? req.query.topic ?? req.body?.type
  if (type !== 'payment' || !dataId) {
    return res.status(200).end() // acknowledged, nothing this integration acts on
  }

  try {
    const payment = new Payment(mpClient)
    const paymentData = await payment.get({ id: dataId })

    const orderId = Number(paymentData.external_reference)
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

    if (order) {
      const status =
        paymentData.status === 'approved'
          ? 'approved'
          : paymentData.status === 'rejected'
            ? 'rejected'
            : 'pending'

      db.prepare('UPDATE orders SET status = ?, mp_payment_id = ? WHERE id = ?').run(
        status,
        String(paymentData.id),
        orderId,
      )
    }
  } catch (err) {
    console.error('Erro ao processar webhook do Mercado Pago:', err)
  }

  res.status(200).end()
})

export default router
