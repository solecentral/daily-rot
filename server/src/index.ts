import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import subscriberRoutes from './routes/subscribers'
import issueRoutes from './routes/issues'
import articleRoutes from './routes/articles'
import memeRoutes from './routes/memes'

const app = express()
const PORT = parseInt(process.env.PORT || '3003', 10)

app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/api', subscriberRoutes)
app.use('/api', issueRoutes)
app.use('/api', articleRoutes)
app.use('/api', memeRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 The Daily Rot backend running on port ${PORT}`)
})
