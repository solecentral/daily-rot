import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

const router = Router()

// POST /api/subscribe
router.post('/subscribe', (req: Request, res: Response) => {
  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  const subscribers = db.getSubscribers()
  const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase())

  if (existing) {
    if (existing.active) {
      return res.status(409).json({ error: 'Already subscribed. You absolute legend.' })
    } else {
      existing.active = true
      existing.subscribedAt = new Date().toISOString()
      db.saveSubscribers(subscribers)
      return res.json({ message: 'Welcome back to the rot! 🎉', subscriber: existing })
    }
  }

  const subscriber = {
    id: `sub_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    email: email.toLowerCase(),
    subscribedAt: new Date().toISOString(),
    unsubscribeToken: `tok_${uuidv4().replace(/-/g, '').slice(0, 24)}`,
    active: true,
  }

  subscribers.push(subscriber)
  db.saveSubscribers(subscribers)

  res.status(201).json({
    message: 'You\'re in! Your brain will never be the same. 🔥',
    subscriber,
  })
})

// POST /api/unsubscribe
router.post('/unsubscribe', (req: Request, res: Response) => {
  const { email, token } = req.body
  const subscribers = db.getSubscribers()
  const sub = subscribers.find(
    s => s.email.toLowerCase() === email?.toLowerCase() && s.unsubscribeToken === token
  )

  if (!sub) {
    return res.status(404).json({ error: 'Subscriber not found or invalid token' })
  }

  sub.active = false
  db.saveSubscribers(subscribers)
  res.json({ message: 'Unsubscribed. Your loss. 💔' })
})

// GET /api/subscribers (admin)
router.get('/subscribers', (req: Request, res: Response) => {
  const subscribers = db.getSubscribers()
  res.json(subscribers)
})

export default router
