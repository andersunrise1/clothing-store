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
