"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const subscribers_1 = __importDefault(require("./routes/subscribers"));
const issues_1 = __importDefault(require("./routes/issues"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3003;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', subscribers_1.default);
app.use('/api', issues_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: '🔥 The Daily Rot server is rotting away nicely' });
});
app.listen(PORT, () => {
    console.log(`🔥 The Daily Rot backend running on http://localhost:${PORT}`);
});
