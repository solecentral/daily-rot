"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const subscribers_1 = __importDefault(require("./routes/subscribers"));
const issues_1 = __importDefault(require("./routes/issues"));
const articles_1 = __importDefault(require("./routes/articles"));
const memes_1 = __importDefault(require("./routes/memes"));
const cron_1 = __importDefault(require("./routes/cron"));
const research_1 = __importDefault(require("./routes/research"));
const drip_1 = __importDefault(require("./routes/drip"));
const activity_1 = __importDefault(require("./routes/activity"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8080', 10);
const allowedOrigins = [
    'https://getdailyrot.com',
    'https://www.getdailyrot.com',
    'https://daily-rot.vercel.app',
    'http://localhost:5176',
    'http://localhost:3003',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true); // allow all for now
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', subscribers_1.default);
app.use('/api', issues_1.default);
app.use('/api', articles_1.default);
app.use('/api', memes_1.default);
app.use('/api/cron', cron_1.default);
app.use('/api', research_1.default);
app.use('/api/cron', drip_1.default);
app.use('/api/activity', activity_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 The Daily Rot backend running on port ${PORT}`);
});
