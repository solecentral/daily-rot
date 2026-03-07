"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const openai_1 = __importDefault(require("openai"));
const brainrot_context_1 = require("../brainrot-context");
const router = (0, express_1.Router)();
async function generateFullArticle(title, summary, section, extra) {
    try {
        const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
        const sectionVoice = {
            rotReport: 'a chaotic internet culture breakdown — cover how it started, why it spread, the best/worst takes, what it says about us',
            seriousNews: 'real news but with an extremely online unhinged lens — explain the story, why the internet is losing its mind, the best reactions, what happens next',
            whoGotCooked: 'a full post-mortem of someone\'s internet L — what they did, how the internet responded, the funniest reactions, whether they can recover',
            unhingedFact: 'a deep dive into a bizarre fact — the history, why it\'s weirder than you think, tangents, other unhinged related facts',
        };
        const prompt = `You are writing for The Daily Rot — a deeply brainrot internet culture newsletter. You are extremely online and fully embedded in the brainrot niche.

${brainrot_context_1.BRAINROT_NICHE_CONTEXT}

Write a FULL article (minimum 700 words) about: "${title}"
Summary/context: ${summary}
${extra ? `Extra context: ${extra}` : ''}
Angle: ${sectionVoice[section]}

Requirements:
- Opening hook that immediately establishes you know the lore — punchy, brainrot-coded, pulls them in
- 4-5 sections with <h2> subheadings covering: origin/what it is, the lore and key players, the internet's reaction and best moments, the discourse/debate, where it's heading
- Naturally mix brainrot vernacular (fr fr, no cap, mogged, glazing, cooked, gooning, rizz, delulu, etc.) with real explanation for people new to the lore
- Reference the maxxing meta, clavicular discourse, ASU frat lore, sigma/NPC culture where it fits
- SPECIFIC details — not vague "the internet reacted" but WHO, WHAT, exact vibes
- Voice: most online person in the group chat who actually knows the lore and is genuinely funny
- End with hot take + subscribe to The Daily Rot

HTML format: <p>, <h2>, <strong> tags only. Flowing prose, no bullet lists.

Return ONLY valid JSON:
{"content": "<full HTML>", "excerpt": "one punchy brainrot sentence under 160 chars"}`;
        const resp = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 2500,
            temperature: 0.8,
        });
        const result = JSON.parse(resp.choices[0].message.content || '{}');
        return {
            content: result.content || `<p>${summary}</p>`,
            excerpt: result.excerpt || summary.slice(0, 160),
        };
    }
    catch {
        // Fallback: template-based long content
        return {
            content: `<p>${summary}</p><p>This moment of pure internet chaos was so unhinged that The Daily Rot had to document it for posterity. The kind of thing you screenshot and send to three different group chats with zero context. The kind of thing that makes you close your phone, stare at the ceiling for 30 seconds, and then immediately open it back up to show someone else.</p><p>We live in a time when the internet moves faster than any human brain can process. What used to take weeks to become a meme takes hours now. What used to take hours takes minutes. By the time you're reading this, there's already a new layer to this story. That's the rot. That's the daily rot.</p><p>If you're not subscribed to The Daily Rot newsletter yet, what are you even doing. Get in here. We cover this kind of thing every single day and somehow make it worse. Subscribe at getdailyrot.com. Your brain cells are already gone — might as well have fun on the way out.</p>`,
            excerpt: summary.slice(0, 160),
        };
    }
}
// GET /api/articles
router.get('/articles', (_req, res) => {
    const articles = db_1.db.getArticles();
    res.json(articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));
});
// GET /api/articles/:slug
router.get('/articles/:slug', (req, res) => {
    const articles = db_1.db.getArticles();
    const article = articles.find(a => a.slug === req.params.slug);
    if (!article)
        return res.status(404).json({ error: 'Article not found' });
    // Increment views
    article.views = (article.views || 0) + 1;
    db_1.db.saveArticles(articles);
    // Return related articles (same section, excluding this one)
    const related = articles
        .filter(a => a.slug !== article.slug && a.section === article.section)
        .slice(0, 3);
    res.json({ ...article, related });
});
// POST /api/articles
router.post('/articles', (req, res) => {
    const articles = db_1.db.getArticles();
    const id = `article_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12)}`;
    const title = req.body.title || 'Untitled';
    const slug = `${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
    const article = {
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
    };
    articles.push(article);
    db_1.db.saveArticles(articles);
    res.status(201).json(article);
});
// PUT /api/articles/:id
router.put('/articles/:id', (req, res) => {
    const articles = db_1.db.getArticles();
    const idx = articles.findIndex(a => a.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Article not found' });
    articles[idx] = { ...articles[idx], ...req.body, id: articles[idx].id, slug: articles[idx].slug };
    db_1.db.saveArticles(articles);
    res.json(articles[idx]);
});
// POST /api/articles/generate/:issueId
// Uses GPT-4o-mini for full-length articles on each section
router.post('/articles/generate/:issueId', async (req, res) => {
    const { issueId } = req.params;
    const issues = db_1.db.getIssues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue)
        return res.status(404).json({ error: 'Issue not found' });
    const articles = db_1.db.getArticles();
    const newArticles = [];
    const sections = [];
    // Rot Report → one article per item
    issue.content.rotReport.forEach(item => {
        sections.push({
            section: 'rotReport',
            title: item.title,
            summary: item.description,
        });
    });
    // Serious News
    sections.push({
        section: 'seriousNews',
        title: issue.content.seriousNewsStupid.headline,
        summary: issue.content.seriousNewsStupid.take,
        extra: issue.content.seriousNewsStupid.headline,
    });
    // Who Got Cooked
    sections.push({
        section: 'whoGotCooked',
        title: `${issue.content.whoGotCooked.who} Got Absolutely Cooked`,
        summary: issue.content.whoGotCooked.what,
        extra: `Subject: ${issue.content.whoGotCooked.who}`,
    });
    // Unhinged Fact
    sections.push({
        section: 'unhingedFact',
        title: 'Today\'s Unhinged Fact Will Destroy Your Group Chat',
        summary: issue.content.unhingedFact,
    });
    // Generate full articles with GPT-4o-mini
    for (const { section, title, summary, extra } of sections) {
        const { content, excerpt } = await generateFullArticle(title, summary, section, extra);
        const id = `article_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12)}`;
        const slug = `${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
        newArticles.push({
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
        });
    }
    articles.push(...newArticles);
    db_1.db.saveArticles(articles);
    res.json({ generated: newArticles.length, articles: newArticles });
});
exports.default = router;
