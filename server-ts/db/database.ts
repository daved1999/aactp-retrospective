import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'db.sqlite')
export const db = new (sqlite3.verbose().Database)(DB_PATH, (err) => {
  if (err) console.error('TS DB connect error', err)
  else console.log('TS SQLite connected')
})

export function run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    db.run(sql, params, function (err: any) {
      if (err) return reject(err)
      resolve({ lastID: this?.lastID, changes: this?.changes })
    })
  })
}

export function all(sql: string, params: any[] = []) {
  return new Promise<any[]>((resolve, reject) => {
    // @ts-ignore
    db.all(sql, params, (err: any, rows: any[]) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

export function get(sql: string, params: any[] = []) {
  return new Promise<any>((resolve, reject) => {
    // @ts-ignore
    db.get(sql, params, (err: any, row: any) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

export function ensureTables() {
  const queries = [] as string[]
  queries.push(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    startDate TEXT,
    endDate TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )`)
  queries.push(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT,
    targetValue REAL,
    currentValue REAL,
    status TEXT,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`)
  queries.push(`CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT,
    source TEXT,
    frequency TEXT,
    score REAL,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`)
  queries.push(`CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    point TEXT,
    issue TEXT,
    improvement TEXT,
    impact TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`)
  queries.push(`CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT,
    occurrenceCount INTEGER,
    keyInsight TEXT,
    actions TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`)
  return new Promise<void>((resolve, reject) => {
    db.serialize(async () => {
      try {
        for (const q of queries) {
          await new Promise((r, j) => db.run(q, [], (err) => (err ? j(err) : r())))
        }
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
}
