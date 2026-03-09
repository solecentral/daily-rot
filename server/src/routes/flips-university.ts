/**
 * /api/flips-university/drop-alert
 * Protected by ADMIN_SECRET header (X-Admin-Secret)
 * Reads upcoming drops from drop-radar, formats alerts, sends to Discord
 */
import { Router, Request, Response } from 'express'
import { readFileSync } from 'fs'
import path from 'path'

const router = Router()

interface Drop {
  id: string
  title: string
  brand: string
  retailPrice: number
  dropDate: string
  dropUrl: string
  hypeScore: number
  margin: number
  avgResell: number
  resellData?: {
    stockx?: { lastSale: number }
    ebay?: { avgSold: number }
  }
}

const DROPS_PATH = path.resolve(__dirname, '../../../../drop-radar/server/data/drops.json')

function requireAuth(req: Request, res: Response, next: () => void) {
  const secret = process.env.ADMIN_SECRET
  const provided = req.headers['x-admin-secret'] || req.query.secret
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

export function getUpcomingDrops(limit = 10): Drop[] {
  const raw = readFileSync(DROPS_PATH, 'utf-8')
  const drops: Drop[] = JSON.parse(raw)

  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return drops
    .filter(d => {
      const dropDate = new Date(d.dropDate)
      return dropDate >= now && dropDate <= weekFromNow
    })
    .sort((a, b) => b.hypeScore - a.hypeScore)
    .slice(0, limit)
}

export function formatDropAlert(drops: Drop[]): string {
  if (drops.length === 0) return '📭 No upcoming drops in the next 7 days.'

  const lines = [
    '🔥 **FLIPS UNIVERSITY — DROP ALERTS** 🔥',
    `📅 Next 7 days | ${drops.length} drop${drops.length > 1 ? 's' : ''} on radar\n`,
  ]

  for (const drop of drops) {
    const dropDate = new Date(drop.dropDate)
    const dateStr = dropDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const timeStr = dropDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    const marginPct = drop.retailPrice > 0 ? Math.round((drop.margin / drop.retailPrice) * 100) : 0

    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`🏷️ **${drop.title}**`)
    lines.push(`📅 ${dateStr} @ ${timeStr}`)
    lines.push(`💰 Retail: $${drop.retailPrice} → Est. Resell: $${drop.avgResell}`)
    lines.push(`📈 Margin: +$${drop.margin} (+${marginPct}%) | Hype: ${drop.hypeScore}/100`)
    lines.push(`🔗 ${drop.dropUrl}`)
    lines.push('')
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push('💡 Set your alarms. Flip responsibly.')

  return lines.join('\n')
}

export async function sendToDiscord(message: string): Promise<boolean> {
  const webhookUrl = process.env.FLIPS_DISCORD_WEBHOOK
  if (!webhookUrl) {
    console.log('[drop-alert] FLIPS_DISCORD_WEBHOOK not set, skipping Discord')
    return false
  }

  try {
    const fetch = require('node-fetch')
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    })
    if (!resp.ok) {
      console.error(`[drop-alert] Discord webhook failed: ${resp.status} ${resp.statusText}`)
      return false
    }
    console.log('[drop-alert] Sent to Discord successfully')
    return true
  } catch (err) {
    console.error('[drop-alert] Discord webhook error:', err)
    return false
  }
}

// POST /api/flips-university/drop-alert
router.post('/drop-alert', requireAuth, async (_req: Request, res: Response) => {
  try {
    const drops = getUpcomingDrops()
    const message = formatDropAlert(drops)

    console.log('[drop-alert] Formatted alert:\n' + message)

    const discordSent = await sendToDiscord(message)

    res.json({
      ok: true,
      dropsFound: drops.length,
      discordSent,
      message,
    })
  } catch (err) {
    console.error('[drop-alert] Error:', err)
    res.status(500).json({ error: 'Failed to generate drop alert', details: String(err) })
  }
})

export default router
