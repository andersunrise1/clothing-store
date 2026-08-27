import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import productsRouter from './routes/products.js'
import brandsRouter from './routes/brands.js'
import videosRouter from './routes/videos.js'
import adminRouter from './routes/admin.js'
import { MAX_UPLOAD_MB } from './uploadConfig.js'
import './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/products', productsRouter)
app.use('/api/brands', brandsRouter)
app.use('/api/videos', videosRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Multer throws its own error type on an oversized upload (videos are the
// realistic case here) — without this, Express's default error handler
// sends an HTML stack trace instead of JSON, which the frontend's
// `res.json()` calls can't parse.
app.use((err, req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `Arquivo muito grande. Limite atual: ${MAX_UPLOAD_MB}MB.` })
  }
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Board Culture API rodando em http://localhost:${PORT}`)
})
