import express from 'express'
import { ensureTables, run, all, get } from '../db/database'

// Minimal typings for request/response
import type { Request, Response } from 'express'

const app = express()
const PORT = process.env.PORT || 5001
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Simple in-file adapters to support TS in this compact MVP
// If the circular import above fails, fallback to directly using sqlite3 within this file

// Utility wrappers (mocked if needed)
const boards = {
  goals: 'goals',
  strategies: 'strategies',
  reflections: 'reflections',
  summaries: 'summaries'
}

async function init() {
  await ensureTables()
}

init().catch((e) => { console.error('Init error', e) })

function toRow(obj: any) { return obj }

app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const rows = await all('SELECT * FROM projects ORDER BY id DESC')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/projects', async (req: Request, res: Response) => {
  const { name, description, startDate, endDate } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const now = new Date().toISOString()
  try {
    const r = await run('INSERT INTO projects (name, description, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', [name, description, startDate, endDate, now, now])
    res.json({ id: r.lastID, name, description, startDate, endDate, createdAt: now, updatedAt: now })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const p = await get('SELECT * FROM projects WHERE id = ?', [req.params.id])
    if (!p) return res.status(404).json({ error: 'not found' })
    res.json(p)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.put('/api/projects/:id', async (req: Request, res: Response) => {
  const { name, description, startDate, endDate } = req.body
  const now = new Date().toISOString()
  try {
    await run('UPDATE projects SET name = ?, description = ?, startDate = ?, endDate = ?, updatedAt = ? WHERE id = ?', [name, description, startDate, endDate, now, req.params.id])
    const updated = await get('SELECT * FROM projects WHERE id = ?', [req.params.id])
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    await run('DELETE FROM goals WHERE project_id = ?', [id])
    await run('DELETE FROM strategies WHERE project_id = ?', [id])
    await run('DELETE FROM reflections WHERE project_id = ?', [id])
    await run('DELETE FROM summaries WHERE project_id = ?', [id])
    await run('DELETE FROM projects WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.get('/api/projects/:id/:board', async (req: Request, res: Response) => {
  const { id, board } = req.params
  if (!Object.keys(boards).includes(board)) return res.status(400).json({ error: 'invalid board' })
  try {
    const rows = await all(`SELECT * FROM ${board} WHERE project_id = ?`, [id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/projects/:id/:board', async (req: Request, res: Response) => {
  const { id, board } = req.params
  const data = req.body
  if (!Object.keys(boards).includes(board)) return res.status(400).json({ error: 'invalid board' })
  const now = new Date().toISOString()
  try {
    let sql = ''
    let values: any[] = []
    if (board === 'goals') {
      sql = 'INSERT INTO goals (project_id, title, targetValue, currentValue, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      values = [id, data.title, data.targetValue, data.currentValue, data.status, data.notes, now, now]
    } else if (board === 'strategies') {
      sql = 'INSERT INTO strategies (project_id, name, source, frequency, score, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      values = [id, data.name, data.source, data.frequency, data.score, data.notes, now, now]
    } else if (board === 'reflections') {
      sql = 'INSERT INTO reflections (project_id, point, issue, improvement, impact, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      values = [id, data.point, data.issue, data.improvement, data.impact, now, now]
    } else if (board === 'summaries') {
      sql = 'INSERT INTO summaries (project_id, name, occurrenceCount, keyInsight, actions, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      values = [id, data.name, data.occurrenceCount, data.keyInsight, data.actions, now, now]
    }
    const r = await run(sql, values)
    res.json({ id: r.lastID, ...data, createdAt: now, updatedAt: now })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.put('/api/projects/:id/:board/:itemId', async (req: Request, res: Response) => {
  const { id, board, itemId } = req.params
  const data = req.body
  if (!Object.keys(boards).includes(board)) return res.status(400).json({ error: 'invalid board' })
  try {
    let sql = ''
    let params: any[] = []
    if (board === 'goals') {
      sql = 'UPDATE goals SET title = ?, targetValue = ?, currentValue = ?, status = ?, notes = ?, updatedAt = ? WHERE id = ? AND project_id = ?'
      const { title, targetValue, currentValue, status, notes } = data
      params = [title, targetValue, currentValue, status, notes, new Date().toISOString(), itemId, id]
    } else if (board === 'strategies') {
      sql = 'UPDATE strategies SET name = ?, source = ?, frequency = ?, score = ?, notes = ?, updatedAt = ? WHERE id = ? AND project_id = ?'
      const { name, source, frequency, score, notes } = data
      params = [name, source, frequency, score, notes, new Date().toISOString(), itemId, id]
    } else if (board === 'reflections') {
      sql = 'UPDATE reflections SET point = ?, issue = ?, improvement = ?, impact = ?, updatedAt = ? WHERE id = ? AND project_id = ?'
      const { point, issue, improvement, impact } = data
      params = [point, issue, improvement, impact, new Date().toISOString(), itemId, id]
    } else if (board === 'summaries') {
      sql = 'UPDATE summaries SET name = ?, occurrenceCount = ?, keyInsight = ?, actions = ?, updatedAt = ? WHERE id = ? AND project_id = ?'
      const { name, occurrenceCount, keyInsight, actions } = data
      params = [name, occurrenceCount, keyInsight, actions, new Date().toISOString(), itemId, id]
    }
    await run(sql, params)
    res.json({ ok: true, updatedAt: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.delete('/api/projects/:id/:board/:itemId', async (req: Request, res: Response) => {
  const { id, board, itemId } = req.params
  if (!Object.keys(boards).includes(board)) return res.status(400).json({ error: 'invalid board' })
  try {
    await run(`DELETE FROM ${board} WHERE id = ? AND project_id = ?`, [itemId, id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.get('/api/projects/:id/dashboard', async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const gTotal = await get('SELECT COUNT(*) as c FROM goals WHERE project_id = ?', [id])
    const gDone = await get("SELECT COUNT(*) as c FROM goals WHERE project_id = ? AND status = 'done'", [id])
    const sTotal = await get('SELECT COUNT(*) as c FROM strategies WHERE project_id = ?', [id])
    const rTotal = await get('SELECT COUNT(*) as c FROM reflections WHERE project_id = ?', [id])
    const smTotal = await get('SELECT COUNT(*) as c FROM summaries WHERE project_id = ?', [id])
    res.json({ project_id: id, goals: { total: gTotal?.c || 0, completed: gDone?.c || 0 }, strategies: { total: sTotal?.c || 0 }, reflections: { total: rTotal?.c || 0 }, summaries: { total: smTotal?.c || 0 }, lastUpdated: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.listen(PORT, () => {
  console.log(`TS Backend listening on http://localhost:${PORT}`)
})
