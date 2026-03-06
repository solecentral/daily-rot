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
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const email_1 = require("../email");
const router = (0, express_1.Router)();
// GET /api/issues
router.get('/issues', (_req, res) => {
    const issues = db_1.db.getIssues();
    res.json(issues.sort((a, b) => b.issueNumber - a.issueNumber));
});
// GET /api/issues/:id
router.get('/issues/:id', (req, res) => {
    const issues = db_1.db.getIssues();
    const issue = issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
});
// POST /api/issues (create)
router.post('/issues', (req, res) => {
    const issues = db_1.db.getIssues();
    const maxNum = issues.reduce((max, i) => Math.max(max, i.issueNumber), 0);
    const issue = {
        id: `issue_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12)}`,
        issueNumber: maxNum + 1,
        subject: req.body.subject || `Issue #${maxNum + 1}`,
        scheduledFor: req.body.scheduledFor || new Date().toISOString(),
        sentAt: null,
        status: 'draft',
        content: req.body.content || getDefaultContent(),
        recipientCount: null,
    };
    issues.push(issue);
    db_1.db.saveIssues(issues);
    res.status(201).json(issue);
});
// PUT /api/issues/:id
router.put('/issues/:id', (req, res) => {
    const issues = db_1.db.getIssues();
    const idx = issues.findIndex(i => i.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Issue not found' });
    issues[idx] = { ...issues[idx], ...req.body, id: issues[idx].id, issueNumber: issues[idx].issueNumber };
    db_1.db.saveIssues(issues);
    res.json(issues[idx]);
});
// POST /api/issues/:id/send
router.post('/issues/:id/send', async (req, res) => {
    const issues = db_1.db.getIssues();
    const issue = issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ error: 'Issue not found' });
    const subscribers = db_1.db.getSubscribers().filter(s => s.active);
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key_here') {
        // Stub mode
        issue.status = 'sent';
        issue.sentAt = new Date().toISOString();
        issue.recipientCount = subscribers.length;
        db_1.db.saveIssues(issues);
        return res.json({
            message: `[STUB] Would have sent to ${subscribers.length} subscribers. Set RESEND_API_KEY to send for real.`,
            recipientCount: subscribers.length,
        });
    }
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const siteUrl = process.env.SITE_URL || 'http://localhost:5176';
        let sent = 0;
        let failed = 0;
        const batchSize = 10;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map(async (sub) => {
                const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${sub.unsubscribeToken}`;
                const html = await (0, email_1.renderIssueEmail)(issue, unsubscribeUrl);
                return resend.emails.send({
                    from: process.env.FROM_EMAIL || 'newsletter@yourdomain.com',
                    to: sub.email,
                    subject: issue.subject,
                    html,
                });
            }));
            sent += results.filter(r => r.status === 'fulfilled').length;
            failed += results.filter(r => r.status === 'rejected').length;
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        issue.status = 'sent';
        issue.sentAt = new Date().toISOString();
        issue.recipientCount = sent;
        db_1.db.saveIssues(issues);
        res.json({ message: `Sent to ${sent} subscribers!`, sent, failed, recipientCount: sent });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to send', details: String(err) });
    }
});
// POST /api/issues/:id/send-test
router.post('/issues/:id/send-test', async (req, res) => {
    const issues = db_1.db.getIssues();
    const issue = issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ error: 'Issue not found' });
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key_here') {
        return res.json({ success: true, messageId: 'stub_test_id' });
    }
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = await (0, email_1.renderIssueEmail)(issue, '#');
        const result = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'newsletter@yourdomain.com',
            to: email,
            subject: `[TEST] ${issue.subject}`,
            html,
        });
        res.json({ success: true, messageId: result.data?.id || 'sent' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to send test email', details: String(err) });
    }
});
// POST /api/issues/generate
router.post('/issues/generate', (_req, res) => {
    res.json(getDefaultContent());
});
// GET /api/stats
router.get('/stats', (_req, res) => {
    const subscribers = db_1.db.getSubscribers();
    const issues = db_1.db.getIssues();
    const active = subscribers.filter(s => s.active).length;
    // Mock growth data for chart
    const now = new Date();
    const growthData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - i));
        return {
            date: date.toISOString().split('T')[0],
            subscribers: Math.floor(active * (0.3 + (i / 29) * 0.7) + Math.random() * 5),
        };
    });
    growthData[growthData.length - 1].subscribers = active;
    res.json({
        totalSubscribers: subscribers.length,
        activeSubscribers: active,
        issuesSent: issues.filter(i => i.status === 'sent').length,
        totalIssues: issues.length,
        openRate: 68.4, // mocked
        clickRate: 24.1, // mocked
        growthData,
    });
});
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
    };
}
exports.default = router;
