"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const https_1 = __importDefault(require("https"));
const router = (0, express_1.Router)();
function fetchReddit(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'DailyRot/1.0',
                'Accept': 'application/json',
            },
        };
        https_1.default.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(new Error('Failed to parse Reddit response'));
                }
            });
        }).on('error', reject);
    });
}
// GET /api/memes/fetch
router.get('/memes/fetch', async (_req, res) => {
    try {
        const data = await fetchReddit('https://www.reddit.com/r/dankmemes/hot.json?limit=25');
        const posts = data?.data?.children || [];
        const imagePosts = posts
            .filter((p) => {
            const url = p.data.url;
            return !p.data.over_18 && !p.data.is_video && /\.(jpg|jpeg|png|gif)$/i.test(url);
        })
            .slice(0, 10)
            .map((p) => ({
            id: p.data.id,
            title: p.data.title,
            url: p.data.url,
        }));
        res.json({ memes: imagePosts, count: imagePosts.length });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch memes from Reddit', details: String(err) });
    }
});
exports.default = router;
