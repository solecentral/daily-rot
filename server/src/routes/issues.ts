import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { Issue } from '../types'
import { renderIssueEmail } from '../email'

const router = Router()

// GET /api/issues
router.get('/issues', (_req: Request, res: Response) => {
  const issues = db.getIssues()
  res.json(issues.sort((a, b) => b.issueNumber - a.issueNumber))
})

// GET /api/issues/:id
router.get('/issues/:id', (req: Request, res: Response) => {
  const issues = db.getIssues()
  const issue = issues.find(i => i.id === req.params.id)
  if (!issue) return res.status(404).json({ error: 'Issue not found' })
  res.json(issue)
})

// POST /api/issues (create)
router.post('/issues', (req: Request, res: Response) => {
  const issues = db.getIssues()
  const maxNum = issues.reduce((max, i) => Math.max(max, i.issueNumber), 0)

  const issue: Issue = {
    id: `issue_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    issueNumber: maxNum + 1,
    subject: req.body.subject || `Issue #${maxNum + 1}`,
    scheduledFor: req.body.scheduledFor || new Date().toISOString(),
    sentAt: null,
    status: 'draft',
    content: req.body.content || getDefaultContent(),
    recipientCount: null,
  }

  issues.push(issue)
  db.saveIssues(issues)
  res.status(201).json(issue)
})

// PUT /api/issues/:id
router.put('/issues/:id', (req: Request, res: Response) => {
  const issues = db.getIssues()
  const idx = issues.findIndex(i => i.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Issue not found' })

  issues[idx] = { ...issues[idx], ...req.body, id: issues[idx].id, issueNumber: issues[idx].issueNumber }
  db.saveIssues(issues)
  res.json(issues[idx])
})

// POST /api/issues/:id/send
router.post('/issues/:id/send', async (req: Request, res: Response) => {
  const issues = db.getIssues()
  const issue = issues.find(i => i.id === req.params.id)
  if (!issue) return res.status(404).json({ error: 'Issue not found' })

  const subscribers = db.getSubscribers().filter(s => s.active)

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key_here') {
    // Stub mode
    issue.status = 'sent'
    issue.sentAt = new Date().toISOString()
    issue.recipientCount = subscribers.length
    db.saveIssues(issues)
    return res.json({
      message: `[STUB] Would have sent to ${subscribers.length} subscribers. Set RESEND_API_KEY to send for real.`,
      recipientCount: subscribers.length,
    })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = await renderIssueEmail(issue)

    const results = await Promise.allSettled(
      subscribers.map(sub =>
        resend.emails.send({
          from: process.env.FROM_EMAIL || 'newsletter@yourdomain.com',
          to: sub.email,
          subject: issue.subject,
          html,
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    issue.status = 'sent'
    issue.sentAt = new Date().toISOString()
    issue.recipientCount = sent
    db.saveIssues(issues)

    res.json({ message: `Sent to ${sent} subscribers!`, recipientCount: sent })
  } catch (err) {
    res.status(500).json({ error: 'Failed to send', details: String(err) })
  }
})

// POST /api/issues/generate
router.post('/issues/generate', (_req: Request, res: Response) => {
  res.json(getDefaultContent())
})

// GET /api/stats
router.get('/stats', (_req: Request, res: Response) => {
  const subscribers = db.getSubscribers()
  const issues = db.getIssues()
  const active = subscribers.filter(s => s.active).length

  // Mock growth data for chart
  const now = new Date()
  const growthData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toISOString().split('T')[0],
      subscribers: Math.floor(active * (0.3 + (i / 29) * 0.7) + Math.random() * 5),
    }
  })
  growthData[growthData.length - 1].subscribers = active

  res.json({
    totalSubscribers: subscribers.length,
    activeSubscribers: active,
    issuesSent: issues.filter(i => i.status === 'sent').length,
    totalIssues: issues.length,
    openRate: 68.4, // mocked
    clickRate: 24.1, // mocked
    growthData,
  })
})

function getDefaultContent() {
  return {
    rotReport: [
      { title: 'Enter Rot Moment #1', description: 'Describe the chaos here...' },
      { title: 'Enter Rot Moment #2', description: 'More chaos...' },
      { title: 'Enter Rot Moment #3', description: 'Even more chaos...' },
    ],
    memeOfTheDay: { description: 'Describe the meme here', imageUrl: null },
    seriousNewsStupid: { headline: 'Real headline here', take: 'Unhinged take here' },
    whoGotCooked: { who: 'Someone on the internet', what: 'What they did' },
    unhingedFact: 'The fact that will destroy your group chat',
  }
}

export default router
