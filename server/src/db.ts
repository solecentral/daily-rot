import fs from 'fs'
import path from 'path'
import { Subscriber, Issue, Article } from './types'

const DATA_DIR = path.join(__dirname, '../data')

function readJSON<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return []
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T[]
}

function writeJSON<T>(filename: string, data: T[]): void {
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
