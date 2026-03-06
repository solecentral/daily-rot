import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { Article } from '../types'

const router = Router()

// GET /api/articles
router.get('/articles', (_req: Request, res: Response) => {
  const articles = db.getArticles()
  res.json(articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))
})

// GET /api/articles/:slug
router.get('/articles/:slug', (req: Request, res: Response) => {
  const articles = db.getArticles()
  const article = articles.find(a => a.slug === req.params.slug)
  if (!article) return res.status(404).json({ error: 'Article not found' })

  // Increment views
  article.views = (article.views || 0) + 1
  db.saveArticles(articles)

  // Return related articles (same section, excluding this one)
  const related = articles
    .filter(a => a.slug !== article.slug && a.section === article.section)
    .slice(0, 3)

  res.json({ ...article, related })
})

// POST /api/articles
router.post('/articles', (req: Request, res: Response) => {
  const articles = db.getArticles()
  const id = `article_${uuidv4().replace(/-/g, '').slice(0, 12)}`
  const title = req.body.title || 'Untitled'
  const slug = `${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`

  const article: Article = {
    id,
    issueId: req.body.issueId || '',
    section: req.body.section || 'rotReport',
    slug,
    title,
    content: req.body.content || '',
    excerpt: req.body.excerpt || '',
    publishedAt: new Date().toISOString(),
    views: 0,
    adSlot: false,
    memeImageUrl: req.body.memeImageUrl || null,
  }

  articles.push(article)
  db.saveArticles(articles)
  res.status(201).json(article)
})

// PUT /api/articles/:id
router.put('/articles/:id', (req: Request, res: Response) => {
  const articles = db.getArticles()
  const idx = articles.findIndex(a => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Article not found' })

  articles[idx] = { ...articles[idx], ...req.body, id: articles[idx].id, slug: articles[idx].slug }
  db.saveArticles(articles)
  res.json(articles[idx])
})

// POST /api/articles/generate/:issueId
router.post('/articles/generate/:issueId', (req: Request, res: Response) => {
  const { issueId } = req.params
  const issues = db.getIssues()
  const issue = issues.find(i => i.id === issueId)
  if (!issue) return res.status(404).json({ error: 'Issue not found' })

  const articles = db.getArticles()
  const siteUrl = process.env.SITE_URL || 'http://localhost:5176'

  const newArticles: Article[] = []

  // Generate articles from issue content
  const sections: Array<{ section: Article['section']; title: string; content: string; excerpt: string }> = []

  // Rot Report → rotReport articles
  issue.content.rotReport.forEach((item, i) => {
    const slug = `${issueId}-rot-${i + 1}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    sections.push({
      section: 'rotReport',
      title: item.title,
      content: `<p>${item.description}</p><p>This moment of internet chaos was documented for posterity by The Daily Rot. We take no responsibility for whatever this does to your brain cells.</p><p>Share this with someone who also has questionable taste in content. They will thank you. Probably. Actually maybe don't do that, just subscribe to The Daily Rot at <a href="${siteUrl}">${siteUrl}</a> and let them find their own way here.</p>`,
      excerpt: item.description.slice(0, 120) + '...',
    })
  })

  // Serious News
  sections.push({
    section: 'seriousNews',
    title: issue.content.seriousNewsStupid.headline,
    content: `<p>${issue.content.seriousNewsStupid.headline}</p><p>Our take: ${issue.content.seriousNewsStupid.take}</p><p>Look, we're not journalists. We're not even sure we're people anymore — we've been on the internet too long. But we saw this headline and we had feelings about it, and those feelings have been lovingly transcribed into this article for your reading pleasure.</p><p>Stay rotted, friends. The world is going to keep being like this regardless.</p>`,
    excerpt: issue.content.seriousNewsStupid.take.slice(0, 120) + '...',
  })

  // Who Got Cooked
  sections.push({
    section: 'whoGotCooked',
    title: `${issue.content.whoGotCooked.who} Got Absolutely Cooked Today`,
    content: `<p>Today's victim: <strong>${issue.content.whoGotCooked.who}</strong>.</p><p>${issue.content.whoGotCooked.what}</p><p>We document these moments not out of cruelty, but out of a deep journalistic commitment to archiving human behavior at its most chaotic. Also it's funny. Also we have nothing else going on. Mostly it's funny though.</p><p>Pour one out. Or don't. They probably deserved it.</p>`,
    excerpt: `${issue.content.whoGotCooked.who}: ${issue.content.whoGotCooked.what}`.slice(0, 120) + '...',
  })

  // Unhinged Fact
  sections.push({
    section: 'unhingedFact',
    title: 'Today\'s Unhinged Fact Will Destroy Your Group Chat',
    content: `<p>${issue.content.unhingedFact}</p><p>We found this fact while doom-scrolling at 1am and immediately had to share it with everyone we know. That's the whole thing. That's the article. You're welcome and we're sorry.</p><p>Send this to someone you want to ruin. Tag us when they respond with a voice memo of them screaming.</p>`,
    excerpt: issue.content.unhingedFact.slice(0, 120) + '...',
  })

  sections.forEach(({ section, title, content, excerpt }) => {
    const id = `article_${uuidv4().replace(/-/g, '').slice(0, 12)}`
    const slug = `${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    const article: Article = {
      id,
      issueId,
      section,
      slug,
      title,
      content,
      excerpt,
      publishedAt: new Date().toISOString(),
      views: 0,
      adSlot: section === 'rotReport' || section === 'seriousNews',
      memeImageUrl: section === 'rotReport' ? (issue.content.memeOfTheDay.imageUrl || null) : null,
    }
    newArticles.push(article)
  })

  articles.push(...newArticles)
  db.saveArticles(articles)

  res.json({ generated: newArticles.length, articles: newArticles })
})

export default router
