import { Router, Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

const router = Router()

// Auth middleware (same as cron routes)
function requireAuth(req: Request, res: Response, next: () => void) {
  const secret = process.env.ADMIN_SECRET
  const provided = req.headers['x-admin-secret'] || req.query.secret
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
const DATA_DIR = process.env.DATA_DIR || '/data'
const DRIP_FILE = path.join(DATA_DIR, 'drip-queue.json')

interface DripEntry {
  subscriberEmail: string
  sendAt: number
  type: 'day3' | 'day7'
  sent: boolean
}

function readQueue(): DripEntry[] {
  try {
    if (!fs.existsSync(DRIP_FILE)) return []
    return JSON.parse(fs.readFileSync(DRIP_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeQueue(queue: DripEntry[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DRIP_FILE, JSON.stringify(queue, null, 2))
}

export function scheduleDrip(email: string) {
  const queue = readQueue()
  queue.push(
    { subscriberEmail: email, sendAt: Date.now() + 3 * 86400000, type: 'day3', sent: false },
    { subscriberEmail: email, sendAt: Date.now() + 7 * 86400000, type: 'day7', sent: false }
  )
  writeQueue(queue)
  console.log(`[drip] Scheduled day3+day7 emails for ${email}`)
}

const DAY3_SUBJECT = 'the lore you need (before you embarrass yourself)'
const DAY7_SUBJECT = 'a week of rot — the best bits'

function buildDay3Html(email: string, siteUrl: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#e5e5e5;font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">🧠 THE DAILY ROT</h1>
    <p style="color:#888;font-size:14px;margin:4px 0 0;">your crash course in internet lore</p>
  </div>

  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:20px;">
    <h2 style="color:#00ff88;margin:0 0 12px;font-size:20px;">the lore you need (before you embarrass yourself)</h2>
    <p style="color:#aaa;line-height:1.7;margin:0 0 16px;">
      ok real talk — if you're gonna understand what this newsletter is about, you need the fundamentals. 
      we've been throwing terms around and we respect you too much to leave you lost. here's the glossary fr fr.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">🪞 looksmaxxing</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      the obsessive optimization of your physical appearance. we're talking mewing (pushing your tongue to the roof of your mouth to reshape your jawline), gua sha, cold showers, bone smashing (yes really — people literally tap their face bones to supposedly stimulate bone remodeling), and now the newest frontier: <strong style="color:#00ff88;">clavicular mogging</strong> (more on that below). if a sigma male had a skincare routine, this is it. the lore runs deep and the community is committed.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">💀 mogging / clavicular mogging</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      to "mog" someone means to out-compete them so hard in looks/presence that they feel inferior just by standing near you. "looksmogging" is walking into a room and raising the bar for everyone else. the newest evolution: <strong style="color:#00ff88;">clavicular mogging</strong> — the collarbone (clavicle) has somehow become the new jawline. people are rating each other's clavicle width and prominence on TikTok. it's real, it's unhinged, and we love to report on it.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">🧘 sigma male</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      the lone wolf archetype who doesn't play by society's rules. where alpha males need approval and betas seek validation, the sigma just does his thing. originally used seriously on self-improvement forums, now used almost entirely ironically. if someone posts a video of a wolf walking alone through snow with phonk music — that's sigma content. the "sigma grindset" meme is its own genre.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">📱 NPC (non-playable character)</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      a person with seemingly no original thoughts — just following the script society wrote for them, responding to stimuli like a video game background character. became a TikTok live phenomenon where creators literally acted like NPCs, saying the same phrases on loop when viewers sent gifts. "gang gang", "mmm ice cream so good", frozen mid-sentence. peak content.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">💫 rizz</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      natural charisma and ability to attract others, especially romantically, often without trying hard. popularized by Kai Cenat. "unspoken rizz" is the highest form — getting the result without saying a word. "rizz god" = someone so charming it's almost supernatural. "no rizz" = hopeless. it's basically the modern word for "game" but with more cultural weight.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">🤡 jestermaxxing / gooning</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      <strong style="color:#00ff88;">jestermaxxing</strong>: intentionally optimizing for chaotic, unhinged clown behavior as a personality strategy. the jester knows the audience and leans all the way in. <strong style="color:#00ff88;">gooning</strong>: being so deep in the content/dopamine loop that you lose track of time and reality entirely. "i've been gooning to this playlist for 3 hours" = cannot stop, brain fully hijacked.
    </p>
  </div>

  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#00ff88;margin:0 0 8px;font-size:16px;">🔥 other essentials</h3>
    <p style="color:#ccc;line-height:1.6;margin:0;font-size:14px;">
      <strong style="color:#fff;">glazing</strong> = excessive praise/simping for someone &nbsp;|&nbsp; 
      <strong style="color:#fff;">cooked</strong> = completely destroyed/no recovery &nbsp;|&nbsp; 
      <strong style="color:#fff;">delulu</strong> = delusional but aspirationally so &nbsp;|&nbsp; 
      <strong style="color:#fff;">mid</strong> = mediocre &nbsp;|&nbsp; 
      <strong style="color:#fff;">W / L</strong> = win / loss &nbsp;|&nbsp; 
      <strong style="color:#fff;">fr fr</strong> = for real for real &nbsp;|&nbsp; 
      <strong style="color:#fff;">no cap</strong> = no lie
    </p>
  </div>

  <div style="text-align:center;margin:28px 0;">
    <a href="${siteUrl}" style="background:#00ff88;color:#000;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
      read today's rot →
    </a>
  </div>

  <p style="color:#555;font-size:12px;text-align:center;line-height:1.8;margin-top:24px;">
    The Daily Rot • <a href="${siteUrl}" style="color:#555;">getdailyrot.com</a><br>
    <a href="${unsubUrl}" style="color:#444;">unsubscribe</a>
  </p>
</body>
</html>`
}

function buildDay7Html(articles: Array<{title: string; excerpt: string; slug: string}>, siteUrl: string, unsubUrl: string): string {
  const articleCards = articles.slice(0, 3).map(a => `
  <div style="background:#111;border:1px solid #1a1a1a;border-radius:8px;padding:18px;margin-bottom:14px;">
    <h3 style="color:#fff;margin:0 0 8px;font-size:15px;line-height:1.4;">${a.title}</h3>
    <p style="color:#999;font-size:13px;line-height:1.6;margin:0 0 12px;">${a.excerpt}</p>
    <a href="${siteUrl}/articles/${a.slug}" style="color:#00ff88;font-size:13px;text-decoration:none;">read the full rot →</a>
  </div>`).join('')

  return `<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#e5e5e5;font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">🧠 THE DAILY ROT</h1>
    <p style="color:#888;font-size:14px;margin:4px 0 0;">one week in, fully cooked</p>
  </div>

  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:20px;">
    <h2 style="color:#00ff88;margin:0 0 12px;font-size:20px;">a week of rot — the best bits</h2>
    <p style="color:#aaa;line-height:1.7;margin:0;">
      you've been subscribed for a week now. your brain is already different. here are some pieces from the archive that went the hardest — in case you missed them or want to re-rot.
    </p>
  </div>

  ${articleCards}

  <div style="background:#0d1f12;border:1px solid #00ff8820;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
    <p style="color:#ccc;margin:0 0 14px;font-size:14px;">the rot doesn't stop. new issue every single day.</p>
    <a href="${siteUrl}" style="background:#00ff88;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
      see what's rotting today →
    </a>
  </div>

  <p style="color:#555;font-size:12px;text-align:center;line-height:1.8;margin-top:24px;">
    The Daily Rot • <a href="${siteUrl}" style="color:#555;">getdailyrot.com</a><br>
    <a href="${unsubUrl}" style="color:#444;">unsubscribe</a>
  </p>
</body>
</html>`
}

// POST /api/cron/drip — called daily to send due drip emails
router.post('/drip', requireAuth, async (req, res) => {
  const queue = readQueue()
  const now = Date.now()
  const due = queue.filter(e => !e.sent && e.sendAt <= now)

  if (due.length === 0) {
    return res.json({ sent: 0, message: 'No drip emails due' })
  }

  let sentCount = 0
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'newsletter@getdailyrot.com'
  const siteUrl = process.env.SITE_URL || 'https://getdailyrot.com'

  // Load articles for day7 emails
  let recentArticles: Array<{title: string; excerpt: string; slug: string}> = []
  try {
    const articlesPath = path.join(DATA_DIR, 'articles.json')
    if (fs.existsSync(articlesPath)) {
      const allArticles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
      recentArticles = allArticles
        .sort((a: {createdAt?: string}, b: {createdAt?: string}) => 
          (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 3)
        .map((a: {title: string; excerpt?: string; slug: string}) => ({
          title: a.title,
          excerpt: a.excerpt || '',
          slug: a.slug
        }))
    }
  } catch { /* no articles yet */ }

  for (const entry of due) {
    try {
      const unsubUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(entry.subscriberEmail)}`
      const isDay3 = entry.type === 'day3'
      const subject = isDay3 ? DAY3_SUBJECT : DAY7_SUBJECT
      const html = isDay3
        ? buildDay3Html(entry.subscriberEmail, siteUrl, unsubUrl)
        : buildDay7Html(recentArticles, siteUrl, unsubUrl)

      await resend.emails.send({
        from: `The Daily Rot <${fromEmail}>`,
        to: entry.subscriberEmail,
        subject,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      entry.sent = true
      sentCount++
      console.log(`[drip] Sent ${entry.type} to ${entry.subscriberEmail}`)
    } catch (e) {
      console.error(`[drip] Failed to send to ${entry.subscriberEmail}:`, e)
    }
  }

  writeQueue(queue)
  res.json({ sent: sentCount, total: due.length })
})

export default router
