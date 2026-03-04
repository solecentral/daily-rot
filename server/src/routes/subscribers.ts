import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

const router = Router()

async function sendWelcomeEmail(email: string, unsubscribeToken: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key_here') {
    console.log(`[STUB] Welcome email would be sent to: ${email}`)
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'newsletter@getdailyrot.com'
    const siteUrl = process.env.SITE_URL || 'https://getdailyrot.com'
    const unsubUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`

    const { data, error } = await resend.emails.send({
      from: `The Daily Rot <${fromEmail}>`,
      to: email,
      subject: '🧠 you just subscribed to something terrible (and we love you for it)',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="background:#0a0a0a;color:#e5e5e5;font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:36px;margin:0;">🧠 THE DAILY ROT</h1>
            <p style="color:#888;margin:8px 0 0;">brain cells not included</p>
          </div>

          <div style="background:#111;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:24px;">
            <h2 style="color:#ff4444;margin:0 0 16px;">YOU'RE IN, DEGEN. 🔥</h2>
            <p style="margin:0 0 16px;line-height:1.6;">
              Welcome to the newsletter that was definitely not written by a functioning adult.
              Every day (when we remember), we'll send you:
            </p>
            <ul style="line-height:2;padding-left:20px;">
              <li>🔥 The <strong>Rot Report</strong> — top tier brain rot</li>
              <li>🐸 <strong>Meme of the Day</strong> — straight from the depths of Reddit</li>
              <li>📰 <strong>Serious News but Make It Stupid</strong></li>
              <li>💀 <strong>Who Got Cooked Today</strong></li>
              <li>🎲 <strong>Random Unhinged Fact</strong></li>
            </ul>
          </div>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="${siteUrl}" style="background:#ff4444;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
              READ THE LATEST ISSUE →
            </a>
          </div>

          <p style="color:#555;font-size:12px;text-align:center;margin-top:32px;">
            You subscribed at ${siteUrl}. No regrets.<br>
            <a href="${unsubUrl}" style="color:#555;">unsubscribe</a>
          </p>
        </body>
        </html>
      `,
    })
    if (error) {
      console.error(`Resend error for ${email}:`, JSON.stringify(error))
    } else {
      console.log(`Welcome email sent to: ${email} | id: ${data?.id}`)
    }
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }
}

// POST /api/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
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
      // Re-send welcome email for reactivated subs
      sendWelcomeEmail(existing.email, existing.unsubscribeToken)
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

  // Fire and forget — don't block the response
  sendWelcomeEmail(subscriber.email, subscriber.unsubscribeToken)

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
