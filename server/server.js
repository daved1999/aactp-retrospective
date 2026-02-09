// AACTP Project Review Canvas Backend
// Detailed implementation matching the canvas structure from images
"use strict";
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/', express.static('./client'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Database setup
const DB_PATH = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite', err);
  } else {
    console.log('SQLite connected');
  }
});

// Promise wrappers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Initialize database tables matching the canvas structure
async function initDatabase() {
  // First, drop old tables if they exist (to handle schema updates)
  await run('DROP TABLE IF EXISTS summaries_actions');
  await run('DROP TABLE IF EXISTS summaries_insights');
  await run('DROP TABLE IF EXISTS reflections');
  await run('DROP TABLE IF EXISTS strategies');
  await run('DROP TABLE IF EXISTS goals_stages');
  await run('DROP TABLE IF EXISTS goals_main');
  await run('DROP TABLE IF EXISTS projects');
  console.log('Old tables dropped');
  
  const queries = [];
  
  // Projects table
  queries.push(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    enterprise TEXT,
    project_code TEXT,
    review_date TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )`);

  // 回顾目标 - Goals (总目标)
  queries.push(`CREATE TABLE IF NOT EXISTS goals_main (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    main_goal TEXT,
    result TEXT,
    ratio TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);

  // 回顾目标 - 阶段目标 (子目标)
  queries.push(`CREATE TABLE IF NOT EXISTS goals_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    stage_goal TEXT,
    result TEXT,
    ratio TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);

  // 评估策略 - Strategies
  queries.push(`CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    strategy_name TEXT,
    target TEXT,
    outcome TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);

  // 反思过程 - Reflections (按分类存储)
  queries.push(`CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    category TEXT, -- 亮点/不足/变化项/标杆案例
    item TEXT, -- 事项
    practice TEXT, -- 好的做法/不足的做法/变化原因/具体做法
    impact TEXT, -- 结果与影响
    insight TEXT, -- 启发与行动
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);

  // 总结规律 - Summaries (领悟/规律/行为)
  queries.push(`CREATE TABLE IF NOT EXISTS summaries_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    insight_type TEXT, -- 领悟/规律/行为
    content TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);

  // 总结规律 - 行动计划
  queries.push(`CREATE TABLE IF NOT EXISTS summaries_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    action_type TEXT, -- 停止行动/继续行动/开始行动
    content TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);

  for (const q of queries) {
    await run(q);
  }
  console.log('Database schema initialized');
}

initDatabase().catch(e => console.error('DB init error:', e));

// ========== PROJECT APIs ==========

// Get all projects with recent 5
app.get('/api/projects', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM projects ORDER BY updatedAt DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get recent 5 projects
app.get('/api/projects/recent', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM projects ORDER BY updatedAt DESC LIMIT 5');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  const { name, description, enterprise, project_code, review_date } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const now = new Date().toISOString();
  try {
    const r = await run(
      'INSERT INTO projects (name, description, enterprise, project_code, review_date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, enterprise, project_code, review_date, now, now]
    );
    res.json({ 
      id: r.lastID, 
      name, 
      description, 
      enterprise, 
      project_code, 
      review_date, 
      createdAt: now, 
      updatedAt: now 
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get single project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const p = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  const { name, description, enterprise, project_code, review_date } = req.body;
  const now = new Date().toISOString();
  try {
    await run(
      'UPDATE projects SET name = ?, description = ?, enterprise = ?, project_code = ?, review_date = ?, updatedAt = ? WHERE id = ?',
      [name, description, enterprise, project_code, review_date, now, req.params.id]
    );
    const updated = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await run('DELETE FROM goals_main WHERE project_id = ?', [id]);
    await run('DELETE FROM goals_stages WHERE project_id = ?', [id]);
    await run('DELETE FROM strategies WHERE project_id = ?', [id]);
    await run('DELETE FROM reflections WHERE project_id = ?', [id]);
    await run('DELETE FROM summaries_insights WHERE project_id = ?', [id]);
    await run('DELETE FROM summaries_actions WHERE project_id = ?', [id]);
    await run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== GOALS APIs ==========

// Get goals (main + stages)
app.get('/api/projects/:id/goals', async (req, res) => {
  try {
    const main = await get('SELECT * FROM goals_main WHERE project_id = ?', [req.params.id]);
    const stages = await all('SELECT * FROM goals_stages WHERE project_id = ?', [req.params.id]);
    res.json({ main: main || {}, stages: stages || [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Save/Update main goal
app.post('/api/projects/:id/goals/main', async (req, res) => {
  const { main_goal, result, ratio } = req.body;
  const now = new Date().toISOString();
  try {
    const existing = await get('SELECT id FROM goals_main WHERE project_id = ?', [req.params.id]);
    if (existing) {
      await run(
        'UPDATE goals_main SET main_goal = ?, result = ?, ratio = ?, updatedAt = ? WHERE project_id = ?',
        [main_goal, result, ratio, now, req.params.id]
      );
    } else {
      await run(
        'INSERT INTO goals_main (project_id, main_goal, result, ratio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, main_goal, result, ratio, now, now]
      );
    }
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Add stage goal
app.post('/api/projects/:id/goals/stages', async (req, res) => {
  const { stage_goal, result, ratio } = req.body;
  const now = new Date().toISOString();
  try {
    const r = await run(
      'INSERT INTO goals_stages (project_id, stage_goal, result, ratio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, stage_goal, result, ratio, now, now]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ id: r.lastID, stage_goal, result, ratio });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Update stage goal
app.put('/api/projects/:id/goals/stages/:stageId', async (req, res) => {
  const { stage_goal, result, ratio } = req.body;
  const now = new Date().toISOString();
  try {
    await run(
      'UPDATE goals_stages SET stage_goal = ?, result = ?, ratio = ?, updatedAt = ? WHERE id = ? AND project_id = ?',
      [stage_goal, result, ratio, now, req.params.stageId, req.params.id]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Delete stage goal
app.delete('/api/projects/:id/goals/stages/:stageId', async (req, res) => {
  try {
    await run('DELETE FROM goals_stages WHERE id = ? AND project_id = ?', [req.params.stageId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== STRATEGIES APIs ==========

app.get('/api/projects/:id/strategies', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM strategies WHERE project_id = ?', [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/projects/:id/strategies', async (req, res) => {
  const { strategy_name, target, outcome } = req.body;
  const now = new Date().toISOString();
  try {
    const r = await run(
      'INSERT INTO strategies (project_id, strategy_name, target, outcome, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, strategy_name, target, outcome, now, now]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ id: r.lastID, strategy_name, target, outcome });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/projects/:id/strategies/:strategyId', async (req, res) => {
  const { strategy_name, target, outcome } = req.body;
  const now = new Date().toISOString();
  try {
    await run(
      'UPDATE strategies SET strategy_name = ?, target = ?, outcome = ?, updatedAt = ? WHERE id = ? AND project_id = ?',
      [strategy_name, target, outcome, now, req.params.strategyId, req.params.id]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/projects/:id/strategies/:strategyId', async (req, res) => {
  try {
    await run('DELETE FROM strategies WHERE id = ? AND project_id = ?', [req.params.strategyId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== REFLECTIONS APIs ==========

app.get('/api/projects/:id/reflections', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM reflections WHERE project_id = ?', [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/projects/:id/reflections', async (req, res) => {
  const { category, item, practice, impact, insight } = req.body;
  const now = new Date().toISOString();
  try {
    const r = await run(
      'INSERT INTO reflections (project_id, category, item, practice, impact, insight, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, category, item, practice, impact, insight, now, now]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ id: r.lastID, category, item, practice, impact, insight });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/projects/:id/reflections/:reflectionId', async (req, res) => {
  const { category, item, practice, impact, insight } = req.body;
  const now = new Date().toISOString();
  try {
    await run(
      'UPDATE reflections SET category = ?, item = ?, practice = ?, impact = ?, insight = ?, updatedAt = ? WHERE id = ? AND project_id = ?',
      [category, item, practice, impact, insight, now, req.params.reflectionId, req.params.id]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/projects/:id/reflections/:reflectionId', async (req, res) => {
  try {
    await run('DELETE FROM reflections WHERE id = ? AND project_id = ?', [req.params.reflectionId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== SUMMARIES APIs ==========

app.get('/api/projects/:id/summaries', async (req, res) => {
  try {
    const insights = await all('SELECT * FROM summaries_insights WHERE project_id = ?', [req.params.id]);
    const actions = await all('SELECT * FROM summaries_actions WHERE project_id = ?', [req.params.id]);
    res.json({ insights, actions });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Add insight (领悟/规律/行为)
app.post('/api/projects/:id/summaries/insights', async (req, res) => {
  const { insight_type, content } = req.body;
  const now = new Date().toISOString();
  try {
    const r = await run(
      'INSERT INTO summaries_insights (project_id, insight_type, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, insight_type, content, now, now]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ id: r.lastID, insight_type, content });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/projects/:id/summaries/insights/:insightId', async (req, res) => {
  const { insight_type, content } = req.body;
  const now = new Date().toISOString();
  try {
    await run(
      'UPDATE summaries_insights SET insight_type = ?, content = ?, updatedAt = ? WHERE id = ? AND project_id = ?',
      [insight_type, content, now, req.params.insightId, req.params.id]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/projects/:id/summaries/insights/:insightId', async (req, res) => {
  try {
    await run('DELETE FROM summaries_insights WHERE id = ? AND project_id = ?', [req.params.insightId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Add action (停止/继续/开始)
app.post('/api/projects/:id/summaries/actions', async (req, res) => {
  const { action_type, content } = req.body;
  const now = new Date().toISOString();
  try {
    const r = await run(
      'INSERT INTO summaries_actions (project_id, action_type, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, action_type, content, now, now]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ id: r.lastID, action_type, content });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.put('/api/projects/:id/summaries/actions/:actionId', async (req, res) => {
  const { action_type, content } = req.body;
  const now = new Date().toISOString();
  try {
    await run(
      'UPDATE summaries_actions SET action_type = ?, content = ?, updatedAt = ? WHERE id = ? AND project_id = ?',
      [action_type, content, now, req.params.actionId, req.params.id]
    );
    await run('UPDATE projects SET updatedAt = ? WHERE id = ?', [now, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/projects/:id/summaries/actions/:actionId', async (req, res) => {
  try {
    await run('DELETE FROM summaries_actions WHERE id = ? AND project_id = ?', [req.params.actionId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== DASHBOARD API ==========

app.get('/api/projects/:id/dashboard', async (req, res) => {
  const id = req.params.id;
  try {
    // Statistics
    const goalsMain = await get('SELECT COUNT(*) as c FROM goals_main WHERE project_id = ?', [id]);
    const goalsStages = await get('SELECT COUNT(*) as c FROM goals_stages WHERE project_id = ?', [id]);
    const strategies = await get('SELECT COUNT(*) as c FROM strategies WHERE project_id = ?', [id]);
    const reflections = await get('SELECT COUNT(*) as c FROM reflections WHERE project_id = ?', [id]);
    const insights = await get('SELECT COUNT(*) as c FROM summaries_insights WHERE project_id = ?', [id]);
    const actions = await get('SELECT COUNT(*) as c FROM summaries_actions WHERE project_id = ?', [id]);
    
    // Reflections by category
    const highlights = await get("SELECT COUNT(*) as c FROM reflections WHERE project_id = ? AND category = '亮点'", [id]);
    const shortcomings = await get("SELECT COUNT(*) as c FROM reflections WHERE project_id = ? AND category = '不足'", [id]);
    const changes = await get("SELECT COUNT(*) as c FROM reflections WHERE project_id = ? AND category = '变化项'", [id]);
    const benchmarks = await get("SELECT COUNT(*) as c FROM reflections WHERE project_id = ? AND category = '标杆案例'", [id]);
    
    // Actions by type
    const stopActions = await get("SELECT COUNT(*) as c FROM summaries_actions WHERE project_id = ? AND action_type = '停止行动'", [id]);
    const continueActions = await get("SELECT COUNT(*) as c FROM summaries_actions WHERE project_id = ? AND action_type = '继续行动'", [id]);
    const startActions = await get("SELECT COUNT(*) as c FROM summaries_actions WHERE project_id = ? AND action_type = '开始行动'", [id]);

    res.json({
      project_id: id,
      goals: {
        main_defined: goalsMain?.c || 0,
        stage_goals: goalsStages?.c || 0
      },
      strategies: strategies?.c || 0,
      reflections: {
        total: reflections?.c || 0,
        by_category: {
          highlights: highlights?.c || 0,
          shortcomings: shortcomings?.c || 0,
          changes: changes?.c || 0,
          benchmarks: benchmarks?.c || 0
        }
      },
      summaries: {
        insights: insights?.c || 0,
        actions: {
          total: actions?.c || 0,
          stop: stopActions?.c || 0,
          continue: continueActions?.c || 0,
          start: startActions?.c || 0
        }
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ========== GLOBAL DASHBOARD ==========

app.get('/api/dashboard', async (req, res) => {
  try {
    const totalProjects = await get('SELECT COUNT(*) as c FROM projects');
    const totalGoals = await get('SELECT COUNT(*) as c FROM goals_stages');
    const totalStrategies = await get('SELECT COUNT(*) as c FROM strategies');
    const totalReflections = await get('SELECT COUNT(*) as c FROM reflections');
    const totalInsights = await get('SELECT COUNT(*) as c FROM summaries_insights');
    const totalActions = await get('SELECT COUNT(*) as c FROM summaries_actions');
    
    // Recent 5 projects
    const recentProjects = await all('SELECT * FROM projects ORDER BY updatedAt DESC LIMIT 5');
    
    res.json({
      statistics: {
        total_projects: totalProjects?.c || 0,
        total_goals: totalGoals?.c || 0,
        total_strategies: totalStrategies?.c || 0,
        total_reflections: totalReflections?.c || 0,
        total_insights: totalInsights?.c || 0,
        total_actions: totalActions?.c || 0
      },
      recent_projects: recentProjects
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`AACTP Project Review Canvas Server listening on http://localhost:${PORT}`);
});
