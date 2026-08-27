import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Public reads — the /videos gallery page and the homepage hero.
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all()
  res.json(rows)
})

router.get('/hero', (req, res) => {
  const row = db.prepare('SELECT * FROM videos WHERE is_hero = 1').get()
  res.json(row ?? null)
})

router.get('/featured', (req, res) => {
  const row = db.prepare('SELECT * FROM videos WHERE is_featured = 1').get()
  res.json(row ?? null)
})

export default router
