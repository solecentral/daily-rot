"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * /api/cron/daily-issue
 * Protected by ADMIN_SECRET header (X-Admin-Secret)
 * Called by macOS cron job at 8am PT daily
 * 1. Fetches trending Reddit posts for meme material
 * 2. Uses OpenAI GPT-4o-mini to generate full brainrot issue
 * 3. Creates issue in DB
 * 4. Sends to all active subscribers via Resend
 */
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const email_1 = require("../email");
const router = (0, express_1.Router)();
// Auth middleware
function requireCronAuth(req, res, next) {
    const secret = process.env.ADMIN_SECRET;
    const provided = req.headers['x-admin-secret'] || req.query.secret;
    if (!secret || provided !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
async function fetchRedditMemes() {
    try {
        const fetch = require('node-fetch');
        // Use .json endpoint for image-heavy subreddits
        const subs = ['memes', 'dankmemes', 'me_irl', 'shitposting', 'internetculture'];
        const sub = subs[Math.floor(Math.random() * subs.length)];
        const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=50`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyRot/1.0)' }
        });
        const data = await r.json();
        const posts = (data?.data?.children || []).map((p) => {
            const rawUrl = p.data.url_overridden_by_dest || p.data.url;
            const isDirectImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(rawUrl);
            // Try multiple image sources in order of preference
            let imageUrl = null;
            if (isDirectImage) {
                imageUrl = rawUrl;
            }
            else if (p.data.preview?.images?.[0]?.source?.url) {
                // Reddit preview URLs use &amp; encoding
                imageUrl = p.data.preview.images[0].source.url.replace(/&amp;/g, '&');
            }
            else if (p.data.media_metadata) {
                // Gallery posts
                const firstMedia = Object.values(p.data.media_metadata)[0];
                if (firstMedia?.s?.u)
                    imageUrl = firstMedia.s.u.replace(/&amp;/g, '&');
                else if (firstMedia?.s?.gif)
                    imageUrl = firstMedia.s.gif.replace(/&amp;/g, '&');
            }
            return { title: p.data.title, url: rawUrl, imageUrl };
        }).filter((p) => p.url && !p.url.includes('v.redd.it') && !p.url.includes('reddit.com/gallery'));
        return posts.slice(0, 15);
    }
    catch (err) {
        console.error('[cron] Reddit fetch error:', err);
        return [];
    }
}
async function generateIssueWithAI(redditPosts) {
    const OpenAI = require('openai');
    const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
    const redditContext = redditPosts.length > 0
        ? `Today's trending Reddit posts:\n${redditPosts.map((p, i) => `${i + 1}. "${p.title}"`).join('\n')}`
        : 'No Reddit data available — generate fresh brainrot content';
    const prompt = `You are the writer for "The Daily Rot" — a chaotic, funny, brainrot internet newsletter for Gen Z / millennials.

${redditContext}

Generate a complete newsletter issue in this EXACT JSON format (no markdown, raw JSON only):
{
  "subject": "a short punchy newsletter subject line (no emojis, <60 chars)",
  "preview": "preview text for email clients (<90 chars)",
  "rotReport": [
    { "title": "Short headline of a real viral internet moment", "description": "2-3 sentences of chaotic commentary on it, lowercase, gen z voice" },
    { "title": "Second viral moment", "description": "2-3 sentences" },
    { "title": "Third viral moment", "description": "2-3 sentences" }
  ],
  "memeOfTheDay": {
    "description": "1-2 sentences describing today's vibe meme — something relatable and cursed",
    "imageUrl": null
  },
  "seriousNewsStupid": {
    "headline": "A real-sounding serious news headline (slightly absurd)",
    "take": "2-3 sentences of completely unhinged take on it, lowercase, as if written by someone who has been online too long"
  },
  "whoGotCooked": {
    "who": "Name of a brand/person/entity that got roasted online today",
    "what": "2-3 sentences describing what happened and why the internet cooked them"
  },
  "unhingedFact": "One genuinely bizarre but true-sounding fact that would destroy any group chat. Make it specific and weird."
}

Rules:
- All text must be lowercase except proper nouns and brand names
- Keep it chaotic, funny, and extremely online
- Reference actual internet culture, not generic content
- The rotReport should feel like real viral moments
- RETURN ONLY THE RAW JSON — no explanation, no markdown fences`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.9,
    });
    const raw = response.choices[0].message.content?.trim() || '{}';
    // Strip markdown fences if present
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
}
// POST /api/cron/daily-issue
router.post('/daily-issue', requireCronAuth, async (req, res) => {
    const startTime = Date.now();
    try {
        console.log('[cron] Starting daily issue generation...');
        // 1. Fetch Reddit memes for context
        const redditPosts = await fetchRedditMemes();
        console.log(`[cron] Fetched ${redditPosts.length} Reddit posts`);
        // 2. Generate issue with AI
        let content;
        const aiContent = await generateIssueWithAI(redditPosts);
        const subject = aiContent.subject || 'The Daily Rot — Fresh Brain Damage';
        // Pick a real meme image from Reddit posts (prefer direct image URLs)
        let memeImageUrl = redditPosts.find(p => p.imageUrl)?.imageUrl || null;
        // Fallback: use meme-api.com if Reddit didn't produce an image
        if (!memeImageUrl) {
            try {
                const fetch = require('node-fetch');
                const memeResp = await fetch('https://meme-api.com/gimme/memes', {
                    headers: { 'User-Agent': 'DailyRot/1.0' }
                });
                const memeData = await memeResp.json();
                if (memeData?.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(memeData.url)) {
                    memeImageUrl = memeData.url;
                }
            }
            catch { /* non-fatal */ }
        }
        console.log('[cron] Meme image:', memeImageUrl || 'none found');
        content = {
            rotReport: aiContent.rotReport || [],
            memeOfTheDay: {
                description: aiContent.memeOfTheDay?.description || '',
                imageUrl: memeImageUrl,
            },
            seriousNewsStupid: aiContent.seriousNewsStupid || { headline: '', take: '' },
            whoGotCooked: aiContent.whoGotCooked || { who: '', what: '' },
            unhingedFact: aiContent.unhingedFact || '',
        };
        console.log('[cron] AI content generated:', subject, '| meme image:', memeImageUrl ? 'yes' : 'none');
        // 3. Create issue in DB
        const issues = db_1.db.getIssues();
        const issueNum = issues.length + 1;
        const issueId = `issue_auto_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 8)}`;
        const newIssue = {
            id: issueId,
            issueNumber: issueNum,
            subject,
            scheduledFor: new Date().toISOString(),
            sentAt: null,
            status: 'draft',
            content,
            recipientCount: null,
        };
        issues.unshift(newIssue);
        db_1.db.saveIssues(issues);
        console.log(`[cron] Issue ${issueId} created`);
        // 3b. Auto-generate articles and backfill slugs into the issue content
        try {
            const { v4: uuid2 } = require('uuid');
            const siteUrl = process.env.SITE_URL || 'https://getdailyrot.com';
            const generatedArticles = [];
            // Rot Report articles
            newIssue.content.rotReport.forEach((item, i) => {
                const id = `article_${uuid2().replace(/-/g, '').slice(0, 12)}`;
                const slug = `${id}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
                item.articleSlug = slug;
                generatedArticles.push({
                    slug, section: 'rotReport', title: item.title,
                    content: `<p>${item.description}</p><p>This moment of internet chaos was documented for posterity by The Daily Rot. We take no responsibility for whatever this does to your brain cells.</p><p>Share this with someone who also has questionable taste in content. They will thank you. Probably.</p>`,
                    excerpt: item.description.slice(0, 120) + '...',
                });
            });
            // Serious News article
            const sn = newIssue.content.seriousNewsStupid;
            const snId = `article_${uuid2().replace(/-/g, '').slice(0, 12)}`;
            const snSlug = `${snId}-${sn.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
            sn.articleSlug = snSlug;
            generatedArticles.push({
                slug: snSlug, section: 'seriousNews', title: sn.headline,
                content: `<p>${sn.headline}</p><p>Our take: ${sn.take}</p><p>Look, we're not journalists. We're not even sure we're people anymore. But we saw this headline and had feelings about it.</p>`,
                excerpt: sn.take.slice(0, 120) + '...',
            });
            // Who Got Cooked article
            const wgc = newIssue.content.whoGotCooked;
            const wgcId = `article_${uuid2().replace(/-/g, '').slice(0, 12)}`;
            const wgcSlug = `${wgcId}-${wgc.who.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-got-cooked`;
            wgc.articleSlug = wgcSlug;
            generatedArticles.push({
                slug: wgcSlug, section: 'whoGotCooked', title: `${wgc.who} Got Absolutely Cooked Today`,
                content: `<p>Today's victim: <strong>${wgc.who}</strong>.</p><p>${wgc.what}</p><p>We document these moments not out of cruelty, but out of a deep journalistic commitment to archiving human behavior at its most chaotic.</p>`,
                excerpt: `${wgc.who}: ${wgc.what}`.slice(0, 120) + '...',
            });
            // Unhinged Fact article
            const ufId = `article_${uuid2().replace(/-/g, '').slice(0, 12)}`;
            const ufSlug = `${ufId}-todays-unhinged-fact`;
            newIssue.content.unhingedFactSlug = ufSlug;
            generatedArticles.push({
                slug: ufSlug, section: 'unhingedFact', title: "Today's Unhinged Fact Will Destroy Your Group Chat",
                content: `<p>${newIssue.content.unhingedFact}</p><p>We found this fact while doom-scrolling at 1am and immediately had to share it with everyone we know. That's the whole thing. That's the article. You're welcome and we're sorry.</p>`,
                excerpt: newIssue.content.unhingedFact.slice(0, 120) + '...',
            });
            // Save articles to DB
            const existingArticles = db_1.db.getArticles();
            generatedArticles.forEach(({ slug, section, title, content: articleContent, excerpt }) => {
                existingArticles.push({
                    id: slug.split('-')[0] + '_' + slug.split('-')[1],
                    issueId,
                    section: section,
                    slug,
                    title,
                    content: articleContent,
                    excerpt,
                    publishedAt: new Date().toISOString(),
                    views: 0,
                    adSlot: section === 'rotReport' || section === 'seriousNews',
                    memeImageUrl: section === 'rotReport' ? (memeImageUrl || null) : null,
                });
            });
            db_1.db.saveArticles(existingArticles);
            // Re-save issue with updated slugs
            const issueIdx = issues.findIndex(i => i.id === issueId);
            if (issueIdx >= 0)
                issues[issueIdx] = newIssue;
            db_1.db.saveIssues(issues);
            console.log(`[cron] Generated ${generatedArticles.length} articles with slugs`);
        }
        catch (artErr) {
            console.error('[cron] Article generation failed (non-fatal):', artErr);
        }
        // 4. Send to all active subscribers
        const subscribers = db_1.db.getSubscribers().filter(s => s.active);
        console.log(`[cron] Sending to ${subscribers.length} subscribers...`);
        if (subscribers.length === 0) {
            // Still mark as sent even if no subscribers
            newIssue.status = 'sent';
            newIssue.sentAt = new Date().toISOString();
            db_1.db.saveIssues(issues);
            return res.json({ ok: true, sent: 0, issue: issueId, message: 'No active subscribers' });
        }
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const siteUrl = process.env.SITE_URL || 'https://getdailyrot.com';
        const fromEmail = process.env.FROM_EMAIL || 'newsletter@getdailyrot.com';
        let sent = 0;
        let failed = 0;
        const batchSize = 10;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map(async (sub) => {
                const unsubUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${sub.unsubscribeToken}`;
                const html = await (0, email_1.renderIssueEmail)(newIssue, unsubUrl);
                const plainText = `The Daily Rot — ${subject}\n\nView online: ${siteUrl}\n\nUnsubscribe: ${unsubUrl}`;
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
                });
            }));
            sent += results.filter(r => r.status === 'fulfilled').length;
            failed += results.filter(r => r.status === 'rejected').length;
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        // Mark as sent
        newIssue.status = 'sent';
        newIssue.sentAt = new Date().toISOString();
        newIssue.recipientCount = sent;
        db_1.db.saveIssues(issues);
        const elapsed = Date.now() - startTime;
        console.log(`[cron] Done! sent=${sent} failed=${failed} time=${elapsed}ms`);
        res.json({
            ok: true,
            issueId,
            subject,
            sent,
            failed,
            total: subscribers.length,
            elapsedMs: elapsed,
        });
    }
    catch (err) {
        console.error('[cron] Error:', err);
        res.status(500).json({ error: 'Failed to generate/send issue', details: String(err) });
    }
});
exports.default = router;
