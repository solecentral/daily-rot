import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import subscriberRoutes from './routes/subscribers'
import issueRoutes from './routes/issues'
import articleRoutes from './routes/articles'
import memeRoutes from './routes/memes'
import cronRoutes from './routes/cron'

const app = express()
const PORT = parseInt(process.env.PORT || '8080', 10)

const allowedOrigins = [
  'https://getdailyrot.com',
  'https://www.getdailyrot.com',
  'https://daily-rot.vercel.app',
  'http://localhost:5176',
  'http://localhost:3003',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // allow all for now
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.options('*', cors())
app.use(express.json())

app.use('/api', subscriberRoutes)
app.use('/api', issueRoutes)
app.use('/api', articleRoutes)
app.use('/api', memeRoutes)
app.use('/api/cron', cronRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 The Daily Rot backend running on port ${PORT}`)
})
