import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// node:sqlite (built into Node 22.5+/24, no native module to compile) —
// simplest possible database for an MVP admin+catalog. Fine to migrate to
// Postgres later if the catalog outgrows a single file, but there's no
// real reason to pay that setup cost before it's needed.
//
// Lives in ../data, not next to the source files: `node --watch` resolves
// a --watch-path pointing at a *file* to that file's whole parent
// directory (an OS-level file-watching granularity limit, not a Node
// bug) — with the db sitting next to db.js, every INSERT/UPDATE touched
// the watched directory and force-restarted the server, wiping every
// admin's in-memory session token mid-request. Keeping data/ and
// uploads/ as siblings of src/, not inside it, is what actually fixes
// that (see package.json's dev script, --watch-path=src only).
const dbPath = path.join(__dirname, '..', 'data', 'boardculture.sqlite')
export const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    -- Set only when the admin opted in to "usar também no Outfit Mixer"
    -- for this product (see server/src/routes/admin.js). outfit_mixer_category
    -- is 'shirt' or 'pants' (matches the frontend's ASPECT_RATIOS keys);
    -- outfit_mixer_image is the separately-cropped result from
    -- UploadCropModal, NOT the same file as image_url — the catalog photo
    -- and the outfit-mixer-aligned crop serve different aspect needs (see
    -- .claude/skills/outfitmixer-cropper-fotos).
    outfit_mixer_category TEXT,
    outfit_mixer_image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// The homepage brand strip (BrandCarousel.jsx) — admin-managed (add/delete
// only, matching the same "delete and re-add" precedent as a product's
// photo above; no edit-in-place endpoint). No price/category, just a name
// and the logo file itself.
db.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// Fase 6: skate videos, admin-managed. is_hero and is_featured each flag at
// most one row at a time (enforced in server/src/routes/admin.js, not by a
// DB constraint) — is_hero is the small, muted, looping background video
// next to the homepage vitrine; is_featured is a separate, full-size
// player (real volume control, no autoplay restriction) shown prominently
// on the homepage — meant for things like event announcements, where the
// audio actually matters. A video can be both, neither, or just one; every
// other row is just a video in the public /videos gallery.
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    is_hero INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// `CREATE TABLE IF NOT EXISTS` above is a no-op on a `videos` table that
// already exists from before `is_featured` was added — SQLite has no "ADD
// COLUMN IF NOT EXISTS", so this is the migration for anyone who already
// has the table without it. Safe to run every startup: the driver throws
// "duplicate column name" once it's already there, which is exactly the
// case we're ignoring.
try {
  db.exec('ALTER TABLE videos ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0')
} catch {
  // column already exists — nothing to do
}

// Real checkout, backed by Mercado Pago (server/src/mercadoPagoConfig.js).
// No customer accounts exist, so contact/shipping info is collected fresh
// at checkout every time — orders.status starts 'pending' and is flipped
// to 'approved'/'rejected' by the webhook once Mercado Pago confirms the
// real payment result (see server/src/routes/paymentWebhook.js). order_items
// snapshots the product name/price at purchase time — a later price change
// or product deletion must never rewrite what was actually paid for.
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    mp_preference_id TEXT,
    mp_payment_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  )
`)
