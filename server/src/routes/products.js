import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Public catalog reads — no auth needed. outfit_mixer_* columns are
// intentionally omitted here: that data is only relevant to the Outfit
// Mixer page (Fase 4 of the roadmap wires it up), and returning it on
// every catalog listing would leak an implementation detail the shopper
// doesn't need.
const PUBLIC_COLUMNS = 'id, name, price_cents, category, image_url, brand_id, created_at'

// category and brandId can combine (both narrow the same list) — clicking
// a brand logo in the homepage carousel (BrandCarousel.jsx -> LojaPage)
// only ever sets brandId, but a shopper could reasonably want both.
router.get('/', (req, res) => {
  const { category, brandId } = req.query
  const conditions = []
  const params = []
  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }
  if (brandId) {
    conditions.push('brand_id = ?')
    params.push(Number(brandId))
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM products ${where} ORDER BY created_at DESC`)
    .all(...params)
  res.json(rows)
})

// Fase 4: the Outfit Mixer's own data source, replacing the frontend's old
// hardcoded test catalog (src/data/outfitOptions.js's SHIRTS/PANTS) with
// real admin-uploaded products. Only products where the admin opted in via
// "usar também no Outfit Mixer?" (Fase 2) show up here — outfit_mixer_image
// is the separately-cropped, aspect-locked result from that step, not
// image_url (the regular catalog photo), per
// .claude/skills/outfitmixer-cropper-fotos. Grouped by category server-side
// so the frontend can hand each group straight to a carousel without
// reshaping the response.
//
// Route order matters: this must come BEFORE '/:id' below, or Express
// would try to match "outfit-mixer-items" as an :id value instead.
router.get('/outfit-mixer-items', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, outfit_mixer_category, outfit_mixer_image
       FROM products
       WHERE outfit_mixer_category IS NOT NULL
       ORDER BY created_at DESC`,
    )
    .all()

  const grouped = { shirt: [], pants: [] }
  for (const row of rows) {
    grouped[row.outfit_mixer_category]?.push({
      id: row.id,
      label: row.name,
      image: row.outfit_mixer_image,
    })
  }
  res.json(grouped)
})

router.get('/:id', (req, res) => {
  const product = db
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM products WHERE id = ?`)
    .get(req.params.id)
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
  res.json(product)
})

export default router
