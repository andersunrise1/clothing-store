import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Public catalog reads — no auth needed. outfit_mixer_* columns are
// intentionally omitted here: that data is only relevant to the Outfit
// Mixer page (Fase 4 of the roadmap wires it up), and returning it on
// every catalog listing would leak an implementation detail the shopper
// doesn't need.
const PUBLIC_COLUMNS = 'id, name, price_cents, category, image_url, created_at'

router.get('/', (req, res) => {
  const { category } = req.query
  const rows = category
    ? db
        .prepare(`SELECT ${PUBLIC_COLUMNS} FROM products WHERE category = ? ORDER BY created_at DESC`)
        .all(category)
    : db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM products ORDER BY created_at DESC`).all()
  res.json(rows)
})

router.get('/:id', (req, res) => {
  const product = db
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM products WHERE id = ?`)
    .get(req.params.id)
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
  res.json(product)
})

export default router
