"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Railway volume is mounted at /data for persistent storage
const DATA_DIR = process.env.NODE_ENV === 'production'
    ? (process.env.DATA_DIR || '/data')
    : path_1.default.join(__dirname, '../data');
const SOURCE_DATA_DIR = path_1.default.join(__dirname, process.env.NODE_ENV === 'production' ? 'data' : '../data');
function ensureDataDir() {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
}
function readJSON(filename) {
    ensureDataDir();
    const filePath = path_1.default.join(DATA_DIR, filename);
    // If writable copy doesn't exist, seed from bundled data
    if (!fs_1.default.existsSync(filePath)) {
        const sourcePath = path_1.default.join(SOURCE_DATA_DIR, filename);
        if (fs_1.default.existsSync(sourcePath)) {
            fs_1.default.copyFileSync(sourcePath, filePath);
        }
        else {
            return [];
        }
    }
    const raw = fs_1.default.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}
function writeJSON(filename, data) {
    ensureDataDir();
    const filePath = path_1.default.join(DATA_DIR, filename);
    fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
exports.db = {
    getSubscribers: () => readJSON('subscribers.json'),
    saveSubscribers: (data) => writeJSON('subscribers.json', data),
    getIssues: () => readJSON('issues.json'),
    saveIssues: (data) => writeJSON('issues.json', data),
    getArticles: () => readJSON('articles.json'),
    saveArticles: (data) => writeJSON('articles.json', data),
};
