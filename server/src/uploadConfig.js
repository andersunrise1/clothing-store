import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// A sibling of src/, not inside it — see db.js's comment on why (avoids a
// node --watch restart loop on every write).
const uploadsDir = path.join(__dirname, '..', 'uploads')

// Configurable so a longer/higher-quality skate video doesn't get silently
// rejected — bump MAX_UPLOAD_MB in server/.env instead of touching code.
// 200MB covers several minutes of decent-quality video; product/brand
// photos share the same limit since they're always far smaller in practice.
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 200)

// A real filename function (not multer's default `dest` shorthand, which
// drops the extension entirely) — express.static relies on the extension
// to set the right Content-Type, and browsers are far stricter about that
// for <video> playback than they are for <img>.
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
})
