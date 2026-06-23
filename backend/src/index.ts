import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import adminRoutes from './routes/admin'
import xpRoutes from './routes/xp'
import profileRoutes from './routes/profiles'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

// ─── Security middleware ───────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// ─── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later' },
})
app.use(limiter)

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'CrochetHub API' })
})

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/admin',    adminRoutes)
app.use('/api/xp',       xpRoutes)
app.use('/api/profiles', profileRoutes)

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── Error handler ────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧶 CrochetHub API running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`   Health:      http://localhost:${PORT}/health\n`)
})

export default app
