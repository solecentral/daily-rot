"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../server/data');
function readJSON(filename) {
    const filePath = path_1.default.join(DATA_DIR, filename);
    if (!fs_1.default.existsSync(filePath))
        return [];
    const raw = fs_1.default.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}
function writeJSON(filename, data) {
    const filePath = path_1.default.join(DATA_DIR, filename);
    fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
exports.db = {
    getSubscribers: () => readJSON('subscribers.json'),
    saveSubscribers: (data) => writeJSON('subscribers.json', data),
    getIssues: () => readJSON('issues.json'),
    saveIssues: (data) => writeJSON('issues.json', data),
};
