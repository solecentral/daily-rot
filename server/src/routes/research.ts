/**
 * /api/research/*
 * AI-powered research pipeline for The Daily Rot
 * 
 * Routes:
 *   POST /api/research/articles        — Auto-research trending brainrot + write full articles (cron)
 *   POST /api/research/custom          — Bryan drops a topic, AI researches + writes full article
 *   GET  /api/research/status          — Last run status + article count
 */

import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { Article } from '../types'
import OpenAI from 'openai'

const router = Router()

// Auth middleware
function requireAuth(req: Request, res: Response, next: () => void) {
  const secret = process.env.ADMIN_SECRET
  const provided = req.headers['x-admin-secret'] || req.query.secret
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function fetchTrendingFromReddit(): Promise<Array<{ title: string; url: string; subreddit: string; score: number; imageUrl?: string }>> {
  try {
    const fetch = require('node-fetch')
    const brainrotSubs = [
      'memes', 'dankmemes', 'me_irl', 'shitposting', 'internetculture',
      'hasan_piker', 'LivestreamFail', 'okbuddyretard', 'teenagers',
      'GenZ', 'TikTokCringe', 'cringe', 'TrueOffMyChest', 'AITA',
      'tifu', 'unpopularopinion', 'OutOfTheLoop', 'ExplainTheJoke'
    ]
    const results: Array<{ title: string; url: string; subreddit: string; score: number; imageUrl?: string }> = []

    // Fetch from 3 random subs for variety
    const selectedSubs = brainrotSubs.sort(() => Math.random() - 0.5).slice(0, 3)
    for (const sub of selectedSubs) {
      try {
        const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyRot/1.0)' }
        })
        const data = await r.json()
        const posts = (data?.data?.children || []).map((p: {
          data: {
            title: string; url: string; score: number;
            preview?: { images?: Array<{ source: { url: string } }> }
          }
        }) => ({
          title: p.data.title,
          url: p.data.url,
          subreddit: sub,
          score: p.data.score,
          imageUrl: p.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || null,
        }))
        results.push(...posts.slice(0, 5))
      } catch { /* skip failed sub */ }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 15)
  } catch {
    return []
  }
}

async function searchTrendingTopics(): Promise<string[]> {
  // Use DuckDuckGo HTML search to find trending internet culture topics
  // (no API key needed)
  const fetch = require('node-fetch')
  const queries = [
    'trending tiktok meme 2026',
    'viral twitter drama this week',
    'instagram reels trend brainrot',
    'what is everyone talking about online today',
  ]
  const topics: string[] = []

  try {
    for (const q of queries.slice(0, 2)) {
      const encoded = encodeURIComponent(q)
      const r = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      const html = await r.text()
      // Extract result snippets
      const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([^<]{20,150})/g)]
        .map(m => m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim())
        .slice(0, 3)
      topics.push(...snippets)
    }
  } catch { /* non-fatal */ }

  return topics
}

async function writeFullArticle(topic: string, context: string, section: Article['section']): Promise<{
  title: string
  content: string
  excerpt: string
  tags: string[]
}> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const sectionContext: Record<Article['section'], string> = {
    rotReport: 'internet culture chaos, viral moments, meme trends, social media drama',
    seriousNews: 'real news events with an unhinged internet-culture lens',
    whoGotCooked: 'someone or something that got absolutely roasted or destroyed online',
    unhingedFact: 'a bizarre, surprising, or deeply unhinged fact from anywhere',
  }

  const prompt = `You are a writer for The Daily Rot — a brainrot internet culture newsletter with a chaotic, funny, Gen-Z voice. Think of a mix between BuzzFeed at its peak and a very online person's Twitter thread.

Topic: ${topic}
Section: ${sectionContext[section]}
Additional context: ${context}

Write a FULL-LENGTH article (minimum 700 words, target 900-1200 words) about this topic. 

Structure:
- A punchy, SEO-friendly headline (not boring, make it cracked)
- An opening hook paragraph that grabs immediately (2-3 sentences max, very punchy)
- 4-6 substantive body sections with bolded subheadings, each 100-200 words
- Cover: how/where it started, why it exploded, the best reactions, the discourse/drama around it, what it means for the culture, where it's going
- Real talk: why people actually care about this
- A closing section that's either a hot take, a call to action ("subscribe to The Daily Rot"), or a funny prediction
- Throughout: maintain the newsletter's voice — chaotic, funny, genuinely informative, never corporate

Format as HTML with <p>, <strong>, <h2> tags. No markdown. Make it feel like actual good longform internet culture journalism that's also extremely fun to read.

Return ONLY a JSON object with these fields:
{
  "title": "article headline",
  "content": "<full HTML article>",
  "excerpt": "one-sentence hook for preview (max 160 chars)",
  "tags": ["tag1", "tag2", "tag3"]
}`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
    temperature: 0.85,
  })

  const result = JSON.parse(resp.choices[0].message.content || '{}')
  return {
    title: result.title || topic,
    content: result.content || `<p>${topic}</p>`,
    excerpt: result.excerpt || topic.slice(0, 160),
    tags: result.tags || [],
  }
}

function saveArticle(data: {
  title: string
  content: string
  excerpt: string
  section: Article['section']
  issueId?: string
  memeImageUrl?: string | null
  tags?: string[]
}): Article {
  const articles = db.getArticles()
  const id = `article_${uuidv4().replace(/-/g, '').slice(0, 12)}`
  const slug = `${id}-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`

  const article: Article = {
    id,
    issueId: data.issueId || 'research',
    section: data.section,
    slug,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    publishedAt: new Date().toISOString(),
    views: 0,
    adSlot: false,
    memeImageUrl: data.memeImageUrl || null,
  }

  articles.unshift(article) // add to front so it shows as newest
  db.saveArticles(articles)
  return article
}

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/research/articles
 * Automated research pipeline — called by cron every 4-6 hours
 * Writes 3-4 full-length articles on trending internet culture topics
 */
router.post('/research/articles', requireAuth as any, async (req: Request, res: Response) => {
  try {
    console.log('[research] Starting automated article research...')

    const [redditPosts, webTopics] = await Promise.all([
      fetchTrendingFromReddit(),
      searchTrendingTopics(),
    ])

    // Build topic list from Reddit + web search
    const topTopics = redditPosts.slice(0, 6).map(p => ({
      title: p.title,
      context: `From r/${p.subreddit} with ${p.score} upvotes. URL: ${p.url}`,
      imageUrl: p.imageUrl || null,
    }))

    // Pick 3 topics to write about (variety of sections)
    const sectionRotation: Article['section'][] = ['rotReport', 'seriousNews', 'whoGotCooked', 'unhingedFact']
    const generated: Article[] = []

    for (let i = 0; i < Math.min(3, topTopics.length); i++) {
      const topic = topTopics[i]
      const section = sectionRotation[i % sectionRotation.length]

      try {
        const webContext = webTopics.slice(i * 2, i * 2 + 2).join(' | ')
        const articleData = await writeFullArticle(
          topic.title,
          `${topic.context} Web context: ${webContext}`,
          section
        )

        const article = saveArticle({
          ...articleData,
          section,
          memeImageUrl: topic.imageUrl,
        })

        generated.push(article)
        console.log(`[research] Wrote article: ${article.title.slice(0, 60)}`)
      } catch (err) {
        console.error(`[research] Failed to write article for topic: ${topic.title}`, err)
      }
    }

    res.json({
      ok: true,
      generated: generated.length,
      articles: generated.map(a => ({ id: a.id, title: a.title, section: a.section, slug: a.slug })),
    })
  } catch (err: unknown) {
    console.error('[research] Error:', err)
    res.status(500).json({ error: 'Research failed', detail: String(err) })
  }
})

/**
 * POST /api/research/custom
 * Bryan drops a topic → AI researches and writes a full article
 * Body: { topic: string, section?: string, notes?: string }
 */
router.post('/research/custom', requireAuth as any, async (req: Request, res: Response) => {
  const { topic, section = 'rotReport', notes = '' } = req.body
  if (!topic) return res.status(400).json({ error: 'topic is required' })

  try {
    console.log(`[research] Custom article: "${topic}"`)

    // Enrich with web search context
    let webContext = notes
    try {
      const fetch = require('node-fetch')
      const encoded = encodeURIComponent(topic + ' meme trend viral 2026')
      const r = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyRot/1.0)' }
      })
      const html = await r.text()
      const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([^<]{20,200})/g)]
        .map(m => m[1].trim()).slice(0, 5).join(' | ')
      webContext = `${notes} | Web: ${snippets}`
    } catch { /* use notes only */ }

    const articleData = await writeFullArticle(
      topic,
      webContext,
      section as Article['section']
    )

    const article = saveArticle({
      ...articleData,
      section: section as Article['section'],
      issueId: 'custom',
    })

    console.log(`[research] Custom article saved: ${article.slug}`)
    res.json({ ok: true, article })
  } catch (err: unknown) {
    console.error('[research] Custom article error:', err)
    res.status(500).json({ error: 'Failed to generate article', detail: String(err) })
  }
})

/**
 * GET /api/research/status
 * Returns article count, last generated, etc.
 */
router.get('/research/status', requireAuth as any, (_req: Request, res: Response) => {
  const articles = db.getArticles()
  const researchArticles = articles.filter(a => a.issueId === 'research' || a.issueId === 'custom')
  const lastArticle = articles[0]

  res.json({
    totalArticles: articles.length,
    researchArticles: researchArticles.length,
    lastPublished: lastArticle?.publishedAt || null,
    lastTitle: lastArticle?.title || null,
  })
})

export default router
