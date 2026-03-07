import { Router, Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

const router = Router()
const DATA_DIR = process.env.DATA_DIR || '/data'
const ACTIVITY_FILE = path.join(DATA_DIR, 'agent-activity.json')

interface AgentState {
  id: string
  name: string
  role: string
  status: 'working' | 'idle' | 'collaborating'
  task: string
  collaboratingWith: string[]
  lastUpdated: number
}

interface ActivityStore {
  agents: AgentState[]
}

function readActivity(): ActivityStore {
  try {
    if (!fs.existsSync(ACTIVITY_FILE)) return { agents: [] }
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf-8'))
  } catch {
    return { agents: [] }
  }
}

function writeActivity(store: ActivityStore) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(store, null, 2))
}

// GET /api/activity — public, returns current agent states
router.get('/', (_req: Request, res: Response) => {
  const store = readActivity()
  res.json(store)
})

// POST /api/activity/update — update/upsert an agent's state
router.post('/update', (req: Request, res: Response) => {
  const secret = req.headers['x-admin-secret']
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id, name, role, status, task, collaboratingWith } = req.body
  if (!id || !status) {
    return res.status(400).json({ error: 'id and status are required' })
  }

  const store = readActivity()
  const idx = store.agents.findIndex(a => a.id === id)
  const updated: AgentState = {
    id,
    name: name || id,
    role: role || 'Agent',
    status,
    task: task || '',
    collaboratingWith: collaboratingWith || [],
    lastUpdated: Date.now(),
  }

  if (idx >= 0) {
    store.agents[idx] = updated
  } else {
    store.agents.push(updated)
  }

  writeActivity(store)
  res.json({ ok: true, agent: updated })
})

// DELETE /api/activity/:id — remove an agent (when task complete)
router.delete('/:id', (req: Request, res: Response) => {
  const secret = req.headers['x-admin-secret']
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const store = readActivity()
  store.agents = store.agents.filter(a => a.id !== req.params.id)
  writeActivity(store)
  res.json({ ok: true })
})

export default router
