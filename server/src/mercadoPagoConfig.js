import { MercadoPagoConfig } from 'mercadopago'

// No real Mercado Pago account is connected to this dev environment yet —
// same "not configured until a real key exists" pattern as every other
// external integration in this project (S3, etc.). Routes that touch
// payment must check isMercadoPagoConfigured() first and 503 otherwise;
// the placeholder token below only exists so the SDK client can be
// constructed at import time without crashing app startup.
export const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN
export const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET

export function isMercadoPagoConfigured() {
  return Boolean(MERCADOPAGO_ACCESS_TOKEN)
}

export const mpClient = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN || 'not-configured',
})
