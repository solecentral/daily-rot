/**
 * /api/cron/daily-issue
 * Protected by ADMIN_SECRET header (X-Admin-Secret)
 * Called by macOS cron job at 8am PT daily
 * 1. Fetches trending Reddit posts for meme material
 * 2. Uses OpenAI GPT-4o-mini to generate full brainrot issue
 * 3. Creates issue in DB
 * 4. Sends to all active subscribers via Resend
 */
import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { renderIssueEmail } from '../email'
import { Issue, Article } from '../types'
import { BRAINROT_NICHE_CONTEXT } from '../brainrot-context'

const router = Router()

// Auth middleware
function requireCronAuth(req: Request, res: Response, next: () => void) {
  const secret = process.env.ADMIN_SECRET
  const provided = req.headers['x-admin-secret'] || req.query.secret
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

async function fetchRedditMemes(): Promise<Array<{ title: string; url: string; imageUrl?: string }>> {
  try {
    const fetch = require('node-fetch')
    // Use .json endpoint for image-heavy subreddits
    const subs = ['Looksmaxxing', 'mewing', 'LivestreamFail', 'GenZ', 'teenagers', 'TikTokCringe', 'okbuddyretard', 'shitposting', 'InternetDrama', 'dankmemes']
    const sub = subs[Math.floor(Math.random() * subs.length)]
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=50`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyRot/1.0)' }
    })
    const data = await r.json()

    const posts = (data?.data?.children || []).map((p: {
      data: {
        title: string
        url: string
        url_overridden_by_dest?: string
        is_video: boolean
        post_hint?: string
        preview?: { images?: Array<{ source: { url: string }; resolutions?: Array<{ url: string; width: number }> }> }
        media_metadata?: Record<string, { s?: { u?: string; gif?: string } }>
      }
    }) => {
      const rawUrl = p.data.url_overridden_by_dest || p.data.url
      const isDirectImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(rawUrl)

      // Try multiple image sources in order of preference
      let imageUrl: string | null = null

      if (isDirectImage) {
        imageUrl = rawUrl
      } else if (p.data.preview?.images?.[0]?.source?.url) {
        // Reddit preview URLs use &amp; encoding
        imageUrl = p.data.preview.images[0].source.url.replace(/&amp;/g, '&')
      } else if (p.data.media_metadata) {
        // Gallery posts
        const firstMedia = Object.values(p.data.media_metadata)[0]
        if (firstMedia?.s?.u) imageUrl = firstMedia.s.u.replace(/&amp;/g, '&')
        else if (firstMedia?.s?.gif) imageUrl = firstMedia.s.gif.replace(/&amp;/g, '&')
      }

      return { title: p.data.title, url: rawUrl, imageUrl }
    }).filter((p: { url: string; imageUrl: string | null }) =>
      p.url && !p.url.includes('v.redd.it') && !p.url.includes('reddit.com/gallery')
    )

    return posts.slice(0, 15)
  } catch (err) {
    console.error('[cron] Reddit fetch error:', err)
    return []
  }
}

async function generateIssueWithAI(redditPosts: Array<{ title: string; url: string }>): Promise<Issue['content']> {
  const OpenAI = require('openai')
  const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY })

  const redditContext = redditPosts.length > 0
    ? `Today's trending Reddit posts:\n${redditPosts.map((p, i) => `${i + 1}. "${p.title}"`).join('\n')}`
    : 'No Reddit data available — generate fresh brainrot content'

  const prompt = `You are the head writer for "The Daily Rot" — a deeply brainrot internet culture newsletter. You are extremely online and deeply embedded in the current brainrot niche.

${BRAINROT_NICHE_CONTEXT}

${redditContext}

Generate a complete newsletter issue focused on CURRENT BRAINROT CULTURE. Prioritize: maxxing discourse (looksmaxxing, retardmaxxing, jestermaxxing, jestergooning), clavicular obsession, ASU frat drama, sigma/NPC culture, gooning, mogging. Mix in viral Reddit/TikTok moments from the context above when relevant.

Use the EXACT JSON format below. Voice: extremely online, brainrot vernacular naturally mixed with explanations for normies, genuinely funny and specific (not generic internet speak):

{
  "subject": "punchy brainrot subject line under 60 chars — sounds like a text from your most online friend",
  "preview": "preview text under 90 chars, equally cracked",
  "rotReport": [
    { "title": "Specific headline about a brainrot/looksmaxx/sigma/mog/drama moment — be specific not generic", "description": "2-3 sentences in brainrot voice — use the vernacular naturally, explain lore for newcomers inline" },
    { "title": "Second specific brainrot moment", "description": "2-3 sentences" },
    { "title": "Third moment — can be from Reddit context above if brainrot relevant", "description": "2-3 sentences" }
  ],
  "memeOfTheDay": {
    "description": "1 sentence brainrot caption — used as fallback only if no image loads",
    "imageUrl": null
  },
  "seriousNewsStupid": {
    "headline": "Real or real-adjacent headline filtered through brainrot lens",
    "take": "2-3 sentences completely cooked take — looksmaxx/sigma/NPC angle where possible, lowercase, extremely online"
  },
  "whoGotCooked": {
    "who": "Person/brand/entity that got absolutely cooked — prioritize current brainrot lore (ASU frat, clavicular discourse, looksmaxx fails, etc.)",
    "what": "2-3 sentences of what happened, in brainrot voice — actual lore and specifics"
  },
  "unhingedFact": "One specific, genuinely unhinged fact related to looksmaxxing, body modification, sigma behavior, or internet culture. The kind of thing that makes someone's jaw drop and immediately screenshot it."
}

Rules:
- All text must be lowercase except proper nouns and brand names
- Keep it chaotic, funny, and extremely online
- Reference actual internet culture, not generic content
- The rotReport should feel like real viral moments
- RETURN ONLY THE RAW JSON — no explanation, no markdown fences`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.9,
  })

  const raw = response.choices[0].message.content?.trim() || '{}'
  // Strip markdown fences if present
  const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned)
}

// POST /api/cron/daily-issue
router.post('/daily-issue', requireCronAuth, async (req: Request, res: Response) => {
  const startTime = Date.now()
  try {
    console.log('[cron] Starting daily issue generation...')

    // 1. Fetch Reddit memes for context
    const redditPosts = await fetchRedditMemes()
    console.log(`[cron] Fetched ${redditPosts.length} Reddit posts`)

    // 2. Generate issue with AI
    let content: Issue['content']
    const aiContent = await generateIssueWithAI(redditPosts) as unknown as Record<string, unknown>
    const subject = (aiContent.subject as string) || 'The Daily Rot — Fresh Brain Damage'

    // Pick a real meme image from Reddit posts (prefer direct image URLs)
    let memeImageUrl: string | null = redditPosts.find(p => p.imageUrl)?.imageUrl || null

    // Fallback: use meme-api.com if Reddit didn't produce an image
    if (!memeImageUrl) {
      try {
        const fetch = require('node-fetch')
        const memeResp = await fetch('https://meme-api.com/gimme/memes', {
          headers: { 'User-Agent': 'DailyRot/1.0' }
        })
        const memeData = await memeResp.json()
        if (memeData?.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(memeData.url)) {
          memeImageUrl = memeData.url
        }
      } catch { /* non-fatal */ }
    }
    console.log('[cron] Meme image:', memeImageUrl || 'none found')

    content = {
      rotReport: (aiContent.rotReport as Issue['content']['rotReport']) || [],
      memeOfTheDay: {
        description: ((aiContent.memeOfTheDay as Record<string, unknown>)?.description as string) || '',
        imageUrl: memeImageUrl,
      },
      seriousNewsStupid: (aiContent.seriousNewsStupid as Issue['content']['seriousNewsStupid']) || { headline: '', take: '' },
      whoGotCooked: (aiContent.whoGotCooked as Issue['content']['whoGotCooked']) || { who: '', what: '' },
      unhingedFact: (aiContent.unhingedFact as string) || '',
    }
    console.log('[cron] AI content generated:', subject, '| meme image:', memeImageUrl ? 'yes' : 'none')

    // 3. Create issue in DB
    const issues = db.getIssues()
    const issueNum = issues.length + 1
    const issueId = `issue_auto_${uuidv4().replace(/-/g, '').slice(0, 8)}`
    const newIssue: Issue = {
      id: issueId,
      issueNumber: issueNum,
      subject,
      scheduledFor: new Date().toISOString(),
      sentAt: null,
      status: 'draft',
      content,
      recipientCount: null,
    }
    issues.unshift(newIssue)
    db.saveIssues(issues)
    console.log(`[cron] Issue ${issueId} created`)

    // 3b. Auto-generate full-length articles using GPT-4o-mini and backfill slugs
    try {
      const openai = new (require('openai').default)({ apiKey: process.env.OPENAI_API_KEY })
      const { v4: uuid2 } = require('uuid')

      async function writeArticle(title: string, summary: string, voice: string): Promise<{ content: string; excerpt: string }> {
        try {
          const resp = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `You are writing for The Daily Rot — a deeply brainrot internet culture newsletter. You are extremely online.

${BRAINROT_NICHE_CONTEXT}

Write a full article (700-1000 words) about: "${title}"
Context: ${summary}
Angle: ${voice}

Requirements:
- Opening hook that proves you know the lore, written in brainrot voice
- 4 sections with <h2> subheadings: what it is, the lore/timeline, internet reactions, hot take
- Mix brainrot vernacular naturally with explanations for normies (maxxing, mogging, gooning, sigma, etc.)
- Connect to current brainrot meta: maxxing culture, clavicular obsession, ASU drama where it fits
- Be SPECIFIC, not vague — real lore, real receipts, real timeline
- End with hot take + The Daily Rot subscribe CTA
Format: HTML with <p>, <h2>, <strong> only. Flowing prose.
Return JSON: {"content": "<html>", "excerpt": "one brainrot-coded punchy sentence under 160 chars"}`
            }],
            response_format: { type: 'json_object' },
            max_tokens: 2000,
            temperature: 0.8,
          })
          const r = JSON.parse(resp.choices[0].message.content || '{}')
          return { content: r.content || `<p>${summary}</p>`, excerpt: r.excerpt || summary.slice(0, 160) }
        } catch {
          return {
            content: `<p>${summary}</p><p>This is exactly the kind of thing The Daily Rot was created to document. The internet moves fast. The chaos never stops. Neither do we.</p><p>If you're not already subscribed to The Daily Rot newsletter, you're doing the internet wrong. Subscribe at getdailyrot.com — daily brain rot delivered straight to your inbox, absolutely free.</p>`,
            excerpt: summary.slice(0, 160),
          }
        }
      }

      // Generate articles for each section in parallel
      const articleTasks = [
        ...newIssue.content.rotReport.map(item => ({
          section: 'rotReport' as const,
          title: item.title,
          summary: item.description,
          voice: 'chaotic internet culture breakdown — origin, spread, best reactions, cultural moment',
          onSlug: (slug: string) => { item.articleSlug = slug },
        })),
        {
          section: 'seriousNews' as const,
          title: newIssue.content.seriousNewsStupid.headline,
          summary: newIssue.content.seriousNewsStupid.take,
          voice: 'real news with unhinged internet lens — the story, online reactions, what it all means',
          onSlug: (slug: string) => { newIssue.content.seriousNewsStupid.articleSlug = slug },
        },
        {
          section: 'whoGotCooked' as const,
          title: `${newIssue.content.whoGotCooked.who} Got Absolutely Cooked`,
          summary: newIssue.content.whoGotCooked.what,
          voice: 'full post-mortem of an internet L — what happened, how the internet responded, funniest reactions',
          onSlug: (slug: string) => { newIssue.content.whoGotCooked.articleSlug = slug },
        },
        {
          section: 'unhingedFact' as const,
          title: "Today's Unhinged Fact Will Destroy Your Group Chat",
          summary: newIssue.content.unhingedFact,
          voice: 'deep dive into a bizarre fact — history, why it\'s weirder than you think, related unhinged tangents',
          onSlug: (slug: string) => { newIssue.content.unhingedFactSlug = slug },
        },
      ]

      const generatedArticles: Article[] = []
      for (const task of articleTasks) {
        const { content, excerpt } = await writeArticle(task.title, task.summary, task.voice)
        const id = `article_${uuid2().replace(/-/g, '').slice(0, 12)}`
        const slug = `${id}-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
        task.onSlug(slug)
        generatedArticles.push({
          id,
          issueId,
          section: task.section,
          slug,
          title: task.title,
          content,
          excerpt,
          publishedAt: new Date().toISOString(),
          views: 0,
          adSlot: task.section === 'rotReport' || task.section === 'seriousNews',
          memeImageUrl: task.section === 'rotReport' ? (memeImageUrl || null) : null,
        })
      }

      const existingArticles = db.getArticles()
      existingArticles.unshift(...generatedArticles)
      db.saveArticles(existingArticles)

      // Re-save issue with updated slugs
      const issueIdx = issues.findIndex(i => i.id === issueId)
      if (issueIdx >= 0) issues[issueIdx] = newIssue
      db.saveIssues(issues)
      console.log(`[cron] Generated ${generatedArticles.length} full-length articles`)
    } catch (artErr) {
      console.error('[cron] Article generation failed (non-fatal):', artErr)
    }

    // 4. Send to all active subscribers
    const subscribers = db.getSubscribers().filter(s => s.active)
    console.log(`[cron] Sending to ${subscribers.length} subscribers...`)

    if (subscribers.length === 0) {
      // Still mark as sent even if no subscribers
      newIssue.status = 'sent'
      newIssue.sentAt = new Date().toISOString()
      db.saveIssues(issues)
      return res.json({ ok: true, sent: 0, issue: issueId, message: 'No active subscribers' })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const siteUrl = process.env.SITE_URL || 'https://getdailyrot.com'
    const fromEmail = process.env.FROM_EMAIL || 'newsletter@getdailyrot.com'

    let sent = 0
    let failed = 0
    const batchSize = 10

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const unsubUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${sub.unsubscribeToken}`
          const html = await renderIssueEmail(newIssue, unsubUrl)
          const plainText = `The Daily Rot — ${subject}\n\nView online: ${siteUrl}\n\nUnsubscribe: ${unsubUrl}`
          return resend.emails.send({
            from: fromEmail,
            to: sub.email,
            subject,
            html,
            text: plainText,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            reply_to: 'hello@getdailyrot.com',
          })
        })
      )
      sent += results.filter(r => r.status === 'fulfilled').length
      failed += results.filter(r => r.status === 'rejected').length
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Mark as sent
    newIssue.status = 'sent'
    newIssue.sentAt = new Date().toISOString()
    newIssue.recipientCount = sent
    db.saveIssues(issues)

    const elapsed = Date.now() - startTime
    console.log(`[cron] Done! sent=${sent} failed=${failed} time=${elapsed}ms`)

    res.json({
      ok: true,
      issueId,
      subject,
      sent,
      failed,
      total: subscribers.length,
      elapsedMs: elapsed,
    })
  } catch (err) {
    console.error('[cron] Error:', err)
    res.status(500).json({ error: 'Failed to generate/send issue', details: String(err) })
  }
})

export default router
