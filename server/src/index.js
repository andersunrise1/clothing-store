import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import productsRouter from './routes/products.js'
import brandsRouter from './routes/brands.js'
import adminRouter from './routes/admin.js'
import './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/products', productsRouter)
app.use('/api/brands', brandsRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Board Culture API rodando em http://localhost:${PORT}`)
})
