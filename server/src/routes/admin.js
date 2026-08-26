import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../db.js'
import { createSession, requireAdmin } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// server/src/routes -> up twice -> server/, then into uploads/ (a sibling
// of src/, not inside it — see db.js's comment on why data/uploads live
// outside the --watch-path'd source tree).
const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads') })

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

router.delete('/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
