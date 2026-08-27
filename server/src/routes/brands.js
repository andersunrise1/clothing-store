import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Public read for the homepage's BrandCarousel — no auth needed.
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM brands ORDER BY created_at DESC').all()
  res.json(rows)
})

export default router
