"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// POST /api/subscribe
router.post('/subscribe', (req, res) => {
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
// GET /api/subscribers (admin)
router.get('/subscribers', (req, res) => {
    const subscribers = db_1.db.getSubscribers();
    res.json(subscribers);
});
exports.default = router;
