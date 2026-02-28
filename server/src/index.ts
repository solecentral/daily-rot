import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

import subscriberRoutes from './routes/subscribers'
import issueRoutes from './routes/issues'
import articleRoutes from './routes/articles'
import memeRoutes from './routes/memes'

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(express.json())

app.use('/api', subscriberRoutes)
app.use('/api', issueRoutes)
app.use('/api', articleRoutes)
app.use('/api', memeRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: '🔥 The Daily Rot server is rotting away nicely' })
})

app.listen(PORT, () => {
  console.log(`🔥 The Daily Rot backend running on http://localhost:${PORT}`)
})
