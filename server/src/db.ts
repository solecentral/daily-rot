import fs from 'fs'
import path from 'path'
import { Subscriber, Issue, Article } from './types'

// Railway volume is mounted at /data for persistent storage
const DATA_DIR = process.env.NODE_ENV === 'production'
  ? (process.env.DATA_DIR || '/data')
  : path.join(__dirname, '../data')

const SOURCE_DATA_DIR = path.join(__dirname, process.env.NODE_ENV === 'production' ? 'data' : '../data')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readJSON<T>(filename: string): T[] {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  // If writable copy doesn't exist, seed from bundled data
  if (!fs.existsSync(filePath)) {
    const sourcePath = path.join(SOURCE_DATA_DIR, filename)
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, filePath)
    } else {
      return []
    }
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T[]
}

function writeJSON<T>(filename: string, data: T[]): void {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export const db = {
  getSubscribers: (): Subscriber[] => readJSON<Subscriber>('subscribers.json'),
  saveSubscribers: (data: Subscriber[]) => writeJSON('subscribers.json', data),
  getIssues: (): Issue[] => readJSON<Issue>('issues.json'),
  saveIssues: (data: Issue[]) => writeJSON('issues.json', data),
  getArticles: (): Article[] => readJSON<Article>('articles.json'),
  saveArticles: (data: Article[]) => writeJSON('articles.json', data),
}
