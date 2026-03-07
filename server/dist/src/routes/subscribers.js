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
const router = (0, express_1.Router)();
async function sendWelcomeEmail(email, unsubscribeToken) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key_here') {
        console.log(`[STUB] Welcome email would be sent to: ${email}`);
        return;
    }
    try {
        const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.FROM_EMAIL || 'newsletter@getdailyrot.com';
        const siteUrl = process.env.SITE_URL || 'https://getdailyrot.com';
        const unsubUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;
        const { data, error } = await resend.emails.send({
            from: `The Daily Rot <${fromEmail}>`,
            to: email,
            reply_to: fromEmail,
            subject: 'Welcome to The Daily Rot',
            headers: {
                'List-Unsubscribe': `<${unsubUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            text: `Welcome to The Daily Rot\n\nYou're in. Every day you'll get:\n- The Rot Report (top brain rot moments)\n- Meme of the Day\n- Serious News but Make It Stupid\n- Who Got Cooked Today\n- Random Unhinged Fact\n\nRead the latest: ${siteUrl}\n\nTo unsubscribe: ${unsubUrl}`,
            html: `
        <!DOCTYPE html>
        <html>
        <body style="background:#0a0a0a;color:#e5e5e5;font-family:monospace;max-width:600px;margin:0 auto;padding:32px 24px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:36px;margin:0;">🧠 THE DAILY ROT</h1>
            <p style="color:#888;margin:8px 0 0;">brain cells not included</p>
          </div>

          <div style="background:#111;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:24px;">
            <h2 style="color:#39ff14;margin:0 0 16px;">YOU'RE IN.</h2>
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
            <a href="${siteUrl}" style="background:#39ff14;color:#0a0a0a;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
              Read the Latest Issue
            </a>
          </div>

          <p style="color:#555;font-size:12px;text-align:center;margin-top:32px;">
            You subscribed at ${siteUrl}. No regrets.<br>
            <a href="${unsubUrl}" style="color:#555;">unsubscribe</a>
          </p>
        </body>
        </html>
      `,
        });
        if (error) {
            console.error(`Resend error for ${email}:`, JSON.stringify(error));
        }
        else {
            console.log(`Welcome email sent to: ${email} | id: ${data?.id}`);
        }
    }
    catch (err) {
        console.error('Failed to send welcome email:', err);
    }
}
// POST /api/subscribe
router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email required' });
    }
    const subscribers = db_1.db.getSubscribers();
    const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        if (existing.active) {
            return res.status(409).json({ error: 'Already subscribed. You absolute legend.' });
        }
        else {
            existing.active = true;
            existing.subscribedAt = new Date().toISOString();
            db_1.db.saveSubscribers(subscribers);
            // Re-send welcome email for reactivated subs
            sendWelcomeEmail(existing.email, existing.unsubscribeToken);
            return res.json({ message: 'Welcome back to the rot! 🎉', subscriber: existing });
        }
    }
    const subscriber = {
        id: `sub_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 12)}`,
        email: email.toLowerCase(),
        subscribedAt: new Date().toISOString(),
        unsubscribeToken: `tok_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 24)}`,
        active: true,
    };
    subscribers.push(subscriber);
    db_1.db.saveSubscribers(subscribers);
    // Fire and forget — don't block the response
    sendWelcomeEmail(subscriber.email, subscriber.unsubscribeToken);
    res.status(201).json({
        message: 'You\'re in! Your brain will never be the same. 🔥',
        subscriber,
    });
});
// POST /api/unsubscribe
router.post('/unsubscribe', (req, res) => {
    const { email, token } = req.body;
    const subscribers = db_1.db.getSubscribers();
    const sub = subscribers.find(s => s.email.toLowerCase() === email?.toLowerCase() && s.unsubscribeToken === token);
    if (!sub) {
        return res.status(404).json({ error: 'Subscriber not found or invalid token' });
    }
    sub.active = false;
    db_1.db.saveSubscribers(subscribers);
    res.json({ message: 'Unsubscribed. Your loss. 💔' });
});
// DELETE /api/subscribers/:id (admin - soft delete)
router.delete('/subscribers/:id', (req, res) => {
    const subscribers = db_1.db.getSubscribers();
    const sub = subscribers.find(s => s.id === req.params.id);
    if (!sub) {
        return res.status(404).json({ error: 'Subscriber not found' });
    }
    sub.active = false;
    db_1.db.saveSubscribers(subscribers);
    res.json({ message: 'Subscriber deactivated', subscriber: sub });
});
// GET /api/subscribers/export (admin - CSV export)
router.get('/subscribers/export', (req, res) => {
    const subscribers = db_1.db.getSubscribers();
    const header = 'email,status,subscribed_at';
    const rows = subscribers.map(s => `${s.email},${s.active ? 'active' : 'unsubscribed'},${s.subscribedAt}`);
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csv);
});
// GET /api/subscribers (admin)
router.get('/subscribers', (req, res) => {
    const subscribers = db_1.db.getSubscribers();
    res.json(subscribers);
});
exports.default = router;
