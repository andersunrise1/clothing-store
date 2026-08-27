import { Router } from 'express'
import { db } from '../db.js'
import { createSession, requireAdmin } from '../middleware/auth.js'
import { upload } from '../uploadConfig.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {}
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    return res.json({ token: createSession() })
  }
  res.status(401).json({ error: 'Usuário ou senha inválidos' })
})

router.get('/products', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
  res.json(rows)
})

// The hybrid photo flow the client explicitly asked for: `image` is the
// real catalog photo (any composition — full-body shot, flat lay,
// whatever the admin has). `outfitMixerCategory` + `outfitMixerImage` are
// only present when the admin opted in to "usar também no Outfit Mixer" —
// outfitMixerImage is the SEPARATELY cropped result from re-running that
// same file through UploadCropModal client-side (aspect-locked per
// category, garment-only), not a second copy of the raw catalog photo.
// See .claude/skills/outfitmixer-cropper-fotos for why those two need to
// be different crops of the same source file, not the same image reused.
router.post('/products', requireAdmin, upload.single('image'), (req, res) => {
  const { name, price, category, outfitMixerCategory, outfitMixerImage } = req.body

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Foto do produto é obrigatória' })
  }

  const priceCents = Math.round(Number(price) * 100)
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return res.status(400).json({ error: 'Preço inválido' })
  }

  if (outfitMixerCategory && !['shirt', 'pants'].includes(outfitMixerCategory)) {
    return res.status(400).json({ error: 'Categoria do Outfit Mixer inválida' })
  }

  const imageUrl = `/uploads/${req.file.filename}`

  const result = db
    .prepare(
      `INSERT INTO products (name, price_cents, category, image_url, outfit_mixer_category, outfit_mixer_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(name, priceCents, category, imageUrl, outfitMixerCategory ?? null, outfitMixerImage ?? null)

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(created)
})

// Edits name/price/category only — not the photo or Outfit Mixer crop.
// Re-cropping a photo needs the original file (see
// .claude/skills/outfitmixer-cropper-fotos on why a cropped result can't
// be re-derived from itself), which this simple text-field edit doesn't
// receive; changing the photo is "delete and re-add" for now.
router.patch('/products/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado' })

  const { name, price, category } = req.body ?? {}
  const priceCents =
    price !== undefined ? Math.round(Number(price) * 100) : existing.price_cents
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return res.status(400).json({ error: 'Preço inválido' })
  }

  db.prepare('UPDATE products SET name = ?, price_cents = ?, category = ? WHERE id = ?').run(
    name || existing.name,
    priceCents,
    category || existing.category,
    req.params.id,
  )

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id))
})

router.delete('/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// Homepage brand strip — just a name + logo file, no price/category/stock.
// Add + delete only (same "delete and re-add to change the photo"
// precedent as products above); there's no real need to edit a brand's
// name in place.
router.get('/brands', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM brands ORDER BY created_at DESC').all()
  res.json(rows)
})

router.post('/brands', requireAdmin, upload.single('logo'), (req, res) => {
  const { name } = req.body ?? {}
  if (!name) {
    return res.status(400).json({ error: 'Nome da marca é obrigatório' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Logo da marca é obrigatório' })
  }

  const logoUrl = `/uploads/${req.file.filename}`
  const result = db
    .prepare('INSERT INTO brands (name, logo_url) VALUES (?, ?)')
    .run(name, logoUrl)
  const created = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(created)
})

router.delete('/brands/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// Fase 6 — skate videos + the homepage hero video. Add + delete, same
// precedent as products/brands above (no in-place edit of the file itself).
// Exactly one row can be flagged is_hero at a time; the PATCH below clears
// any previous flag before setting a new one, or just clears it outright
// (isHero: false) so the home can go back to its plain placeholder without
// deleting the video from the gallery.
router.get('/videos', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all()
  res.json(rows)
})

router.post('/videos', requireAdmin, upload.single('video'), (req, res) => {
  const { title, isHero, isFeatured } = req.body ?? {}
  if (!title) {
    return res.status(400).json({ error: 'Título do vídeo é obrigatório' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo de vídeo é obrigatório' })
  }

  const videoUrl = `/uploads/${req.file.filename}`
  const makeHero = isHero === 'true'
  const makeFeatured = isFeatured === 'true'

  if (makeHero) {
    db.prepare('UPDATE videos SET is_hero = 0').run()
  }
  if (makeFeatured) {
    db.prepare('UPDATE videos SET is_featured = 0').run()
  }

  const result = db
    .prepare('INSERT INTO videos (title, video_url, is_hero, is_featured) VALUES (?, ?, ?, ?)')
    .run(title, videoUrl, makeHero ? 1 : 0, makeFeatured ? 1 : 0)

  const created = db.prepare('SELECT * FROM videos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(created)
})

router.patch('/videos/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Vídeo não encontrado' })

  const { isHero, isFeatured } = req.body ?? {}
  if (isHero === true) {
    db.prepare('UPDATE videos SET is_hero = 0').run()
    db.prepare('UPDATE videos SET is_hero = 1 WHERE id = ?').run(req.params.id)
  } else if (isHero === false) {
    db.prepare('UPDATE videos SET is_hero = 0 WHERE id = ?').run(req.params.id)
  }

  if (isFeatured === true) {
    db.prepare('UPDATE videos SET is_featured = 0').run()
    db.prepare('UPDATE videos SET is_featured = 1 WHERE id = ?').run(req.params.id)
  } else if (isFeatured === false) {
    db.prepare('UPDATE videos SET is_featured = 0 WHERE id = ?').run(req.params.id)
  }

  res.json(db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id))
})

router.delete('/videos/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// Read-only for now — status is driven entirely by the real Mercado Pago
// webhook (server/src/routes/paymentWebhook.js), not something an admin
// edits by hand. What the shop owner actually needs here is visibility:
// what was ordered, by whom, and whether it was actually paid for, so it
// can be shipped.
router.get('/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
  const withItems = orders.map((order) => ({ ...order, items: itemsStmt.all(order.id) }))
  res.json(withItems)
})

export default router
