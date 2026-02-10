// AACTP Project Review Canvas - Offline Version (PWA/APP)
// Uses localStorage for data persistence - no backend required

const DB_KEY = 'aactp_projects';
const DB_VERSION = '1.0';

let currentProjectId = null;
let currentModule = null;
let statsChart = null;

// Database Operations
function getDB() {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : { projects: [], version: DB_VERSION };
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Utility functions
function $(selector) {
  return document.querySelector(selector);
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Mobile Sidebar Management
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  if (sidebar.classList.contains('active')) {
    closeSidebar();
  } else {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
}

// Close sidebar when pressing Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeSidebar();
  }
});

// View Management
function hideAllViews() {
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
}

function showDashboard() {
  hideAllViews();
  $('#dashboard-view').classList.remove('hidden');
  updateActiveNav('dashboard');
  loadDashboardData();
}

function showProjectList() {
  hideAllViews();
  $('#project-list-view').classList.remove('hidden');
  updateActiveNav('projects');
  loadProjects();
}

function showProjectDetail(projectId = null) {
  hideAllViews();
  $('#project-detail-view').classList.remove('hidden');
  updateActiveNav('projects');
  
  if (projectId) {
    currentProjectId = projectId;
    loadProjectDetail(projectId);
  } else {
    currentProjectId = null;
    $('#project-title').textContent = '新建复盘项目';
    clearProjectForm();
  }
}

function updateActiveNav(view) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (view === 'dashboard') {
    document.querySelector('.nav-item:nth-child(1)').classList.add('active');
  } else if (view === 'projects') {
    document.querySelector('.nav-item:nth-child(2)').classList.add('active');
  }
}

// Dashboard Functions
function loadDashboardData() {
  const db = getDB();
  const projects = db.projects || [];
  
  // Calculate statistics
  let totalGoals = 0;
  let totalStrategies = 0;
  let totalReflections = 0;
  let totalInsights = 0;
  let totalActions = 0;
  
  projects.forEach(p => {
    totalGoals += (p.goals?.stages?.length || 0);
    totalStrategies += (p.strategies?.length || 0);
    totalReflections += (p.reflections?.length || 0);
    totalInsights += (p.summaries?.insights?.length || 0);
    totalActions += (p.summaries?.actions?.length || 0);
  });
  
  // Update stats
  $('#total-projects').textContent = projects.length;
  $('#total-goals').textContent = totalGoals;
  $('#total-strategies').textContent = totalStrategies;
  $('#total-reflections').textContent = totalReflections;
  $('#total-insights').textContent = totalInsights;
  $('#total-actions').textContent = totalActions;
  
  // Update chart
  updateStatsChart({
    total_goals: totalGoals,
    total_strategies: totalStrategies,
    total_reflections: totalReflections,
    total_insights: totalInsights,
    total_actions: totalActions
  });
  
  // Update recent projects
  const sorted = [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  renderRecentProjects(sorted.slice(0, 5));
}

function updateStatsChart(stats) {
  const ctx = $('#statsChart');
  if (!ctx) return;
  
  if (statsChart) {
    statsChart.destroy();
  }
  
  statsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['阶段目标', '评估策略', '反思记录', '总结规律', '行动计划'],
      datasets: [{
        data: [
          stats.total_goals,
          stats.total_strategies,
          stats.total_reflections,
          stats.total_insights,
          stats.total_actions
        ],
        backgroundColor: [
          '#e74c3c',
          '#f39c12',
          '#3498db',
          '#27ae60',
          '#9b59b6'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function renderRecentProjects(projects) {
  const container = $('#recent-projects');
  if (!projects || projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>暂无复盘项目</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = projects.map(project => `
    <div class="recent-item" onclick="showProjectDetail('${project.id}')">
      <h4>${project.name}</h4>
      <p>${project.enterprise || '未填写企业'} · ${formatDate(project.review_date) || '未设置日期'}</p>
    </div>
  `).join('');
}

// Project Functions
function loadProjects() {
  const db = getDB();
  const projects = db.projects || [];
  renderProjectsList(projects);
}

function renderProjectsList(projects) {
  const container = $('#projects-container');
  if (!projects || projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">📁</div>
        <p>暂无复盘项目</p>
        <button class="btn-primary" onclick="createNewProject()">创建第一个项目</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = projects.map(project => `
    <div class="project-card" onclick="showProjectDetail('${project.id}')">
      <h3>${project.name}</h3>
      <p>${project.enterprise || '未填写企业'}</p>
      <p>编码: ${project.project_code || '未设置'}</p>
      <div class="project-meta">
        <span>📅 ${formatDate(project.review_date) || '未设置日期'}</span>
        <span>🕐 ${formatDateTime(project.updatedAt)}</span>
      </div>
    </div>
  `).join('');
}

function loadProjectDetail(projectId) {
  const db = getDB();
  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    showToast('项目不存在', true);
    return;
  }
  
  $('#project-title').textContent = project.name;
  $('#project-enterprise').value = project.enterprise || '';
  $('#project-name').value = project.name || '';
  $('#project-code').value = project.project_code || '';
  $('#project-date').value = project.review_date || '';
  
  updateModuleCards(project);
}

function updateModuleCards(project) {
  const goalsCount = project.goals?.stages?.length || 0;
  const hasMainGoal = project.goals?.main?.main_goal ? true : false;
  
  $('#goals-count').textContent = `${goalsCount} 个阶段目标`;
  $('#goals-status').textContent = hasMainGoal ? '已填写' : '未填写';
  $('#goals-status').className = `module-status ${hasMainGoal ? 'completed' : ''}`;
  
  const strategiesCount = project.strategies?.length || 0;
  $('#strategies-count').textContent = `${strategiesCount} 个策略`;
  $('#strategies-status').textContent = strategiesCount > 0 ? '已填写' : '未填写';
  $('#strategies-status').className = `module-status ${strategiesCount > 0 ? 'completed' : ''}`;
  
  const reflectionsCount = project.reflections?.length || 0;
  $('#reflections-count').textContent = `${reflectionsCount} 条记录`;
  $('#reflections-status').textContent = reflectionsCount > 0 ? '已填写' : '未填写';
  $('#reflections-status').className = `module-status ${reflectionsCount > 0 ? 'completed' : ''}`;
  
  const insightsCount = project.summaries?.insights?.length || 0;
  const actionsCount = project.summaries?.actions?.length || 0;
  const summariesCount = insightsCount + actionsCount;
  $('#summaries-count').textContent = `${summariesCount} 条规律/计划`;
  $('#summaries-status').textContent = summariesCount > 0 ? '已填写' : '未填写';
  $('#summaries-status').className = `module-status ${summariesCount > 0 ? 'completed' : ''}`;
}

function clearProjectForm() {
  $('#project-enterprise').value = '';
  $('#project-name').value = '';
  $('#project-code').value = '';
  $('#project-date').value = '';
  
  ['goals', 'strategies', 'reflections', 'summaries'].forEach(module => {
    $(`#${module}-status`).textContent = '未填写';
    $(`#${module}-status`).className = 'module-status';
    $(`#${module}-count`).textContent = module === 'goals' ? '0 个阶段目标' : 
                                          module === 'strategies' ? '0 个策略' :
                                          module === 'reflections' ? '0 条记录' : '0 条规律';
  });
}

function saveProject() {
  const db = getDB();
  const data = {
    enterprise: $('#project-enterprise').value,
    name: $('#project-name').value,
    project_code: $('#project-code').value,
    review_date: $('#project-date').value
  };
  
  if (!data.name) {
    showToast('请输入项目名称', true);
    return;
  }
  
  const now = new Date().toISOString();
  
  if (currentProjectId) {
    const index = db.projects.findIndex(p => p.id === currentProjectId);
    if (index !== -1) {
      db.projects[index] = { ...db.projects[index], ...data, updatedAt: now };
      saveDB(db);
      showToast('项目更新成功');
    }
  } else {
    const newProject = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
      goals: { main: {}, stages: [] },
      strategies: [],
      reflections: [],
      summaries: { insights: [], actions: [] }
    };
    db.projects.push(newProject);
    currentProjectId = newProject.id;
    $('#project-title').textContent = data.name;
    saveDB(db);
    showToast('项目创建成功');
  }
  loadDashboardData();
}

function deleteCurrentProject() {
  if (!currentProjectId) {
    goBack();
    return;
  }
  
  if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) {
    return;
  }
  
  const db = getDB();
  db.projects = db.projects.filter(p => p.id !== currentProjectId);
  saveDB(db);
  showToast('项目已删除');
  goBack();
  loadDashboardData();
}

// Module Functions
function openModule(module) {
  currentModule = module;
  hideAllViews();
  $('#module-edit-view').classList.remove('hidden');
  
  const titles = {
    goals: '回顾目标',
    strategies: '评估策略',
    reflections: '反思过程',
    summaries: '总结规律'
  };
  
  $('#module-title').textContent = titles[module];
  loadModuleContent(module);
}

function closeModule() {
  showProjectDetail(currentProjectId);
}

function loadModuleContent(module) {
  const container = $('#module-content');
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  
  if (!project) {
    container.innerHTML = '<p class="empty-state">请先保存项目基本信息</p>';
    return;
  }
  
  switch (module) {
    case 'goals':
      renderGoalsModule(container, project);
      break;
    case 'strategies':
      renderStrategiesModule(container, project);
      break;
    case 'reflections':
      renderReflectionsModule(container, project);
      break;
    case 'summaries':
      renderSummariesModule(container, project);
      break;
  }
}

function renderGoalsModule(container, project) {
  const goals = project.goals || { main: {}, stages: [] };
  
  container.innerHTML = `
    <div class="module-section">
      <h3>总目标</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>总目标</label>
          <input type="text" id="main-goal" value="${goals.main?.main_goal || ''}" placeholder="输入总目标">
        </div>
        <div class="form-group">
          <label>结果</label>
          <input type="text" id="main-result" value="${goals.main?.result || ''}" placeholder="输入结果">
        </div>
        <div class="form-group">
          <label>比率 (%)</label>
          <input type="text" id="main-ratio" value="${goals.main?.ratio || ''}" placeholder="输入完成比率">
        </div>
      </div>
      <button class="btn-primary" onclick="saveMainGoal()" style="margin-top: 15px;">保存总目标</button>
    </div>
    
    <div class="module-section">
      <h3>阶段目标</h3>
      <div id="stage-goals-list">
        ${renderStageGoalsList(goals.stages)}
      </div>
      <div class="subsection">
        <h4>添加阶段目标</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>阶段目标</label>
            <input type="text" id="new-stage-goal" placeholder="输入阶段目标">
          </div>
          <div class="form-group">
            <label>结果</label>
            <input type="text" id="new-stage-result" placeholder="输入结果">
          </div>
          <div class="form-group">
            <label>比率 (%)</label>
            <input type="text" id="new-stage-ratio" placeholder="输入完成比率">
          </div>
        </div>
        <button class="btn-primary" onclick="addStageGoal()" style="margin-top: 15px;">添加阶段目标</button>
      </div>
    </div>
  `;
}

function renderStageGoalsList(stages) {
  if (!stages || stages.length === 0) {
    return '<p class="empty-state">暂无阶段目标</p>';
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>阶段目标</th>
          <th>结果</th>
          <th>比率</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${stages.map((stage, index) => `
          <tr>
            <td>${stage.stage_goal}</td>
            <td>${stage.result}</td>
            <td>${stage.ratio}%</td>
            <td>
              <button class="btn-small btn-delete" onclick="deleteStageGoal(${index})">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function saveMainGoal() {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) return;
  
  project.goals = project.goals || { main: {}, stages: [] };
  project.goals.main = {
    main_goal: $('#main-goal').value,
    result: $('#main-result').value,
    ratio: $('#main-ratio').value
  };
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('总目标保存成功');
}

function addStageGoal() {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) return;
  
  const data = {
    stage_goal: $('#new-stage-goal').value,
    result: $('#new-stage-result').value,
    ratio: $('#new-stage-ratio').value
  };
  
  if (!data.stage_goal) {
    showToast('请输入阶段目标', true);
    return;
  }
  
  project.goals = project.goals || { main: {}, stages: [] };
  project.goals.stages.push(data);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('阶段目标添加成功');
  loadModuleContent('goals');
  refreshProjectDashboard();
}

function deleteStageGoal(index) {
  if (!confirm('确定删除此阶段目标？')) return;
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project || !project.goals?.stages) return;
  
  project.goals.stages.splice(index, 1);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('已删除');
  loadModuleContent('goals');
  refreshProjectDashboard();
}

function renderStrategiesModule(container, project) {
  const strategies = project.strategies || [];
  
  container.innerHTML = `
    <div class="module-section">
      <h3>策略列表</h3>
      <div id="strategies-list">
        ${renderStrategiesList(strategies)}
      </div>
      <div class="subsection">
        <h4>添加策略</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>策略名称</label>
            <input type="text" id="new-strategy-name" placeholder="输入策略名称">
          </div>
          <div class="form-group">
            <label>目标</label>
            <input type="text" id="new-strategy-target" placeholder="输入目标">
          </div>
          <div class="form-group">
            <label>结果</label>
            <input type="text" id="new-strategy-outcome" placeholder="输入结果">
          </div>
        </div>
        <button class="btn-primary" onclick="addStrategy()" style="margin-top: 15px;">添加策略</button>
      </div>
    </div>
  `;
}

function renderStrategiesList(strategies) {
  if (!strategies || strategies.length === 0) {
    return '<p class="empty-state">暂无策略</p>';
  }
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>策略名称</th>
          <th>目标</th>
          <th>结果</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${strategies.map((s, index) => `
          <tr>
            <td>${s.strategy_name}</td>
            <td>${s.target}</td>
            <td>${s.outcome}</td>
            <td>
              <button class="btn-small btn-delete" onclick="deleteStrategy(${index})">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function addStrategy() {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) return;
  
  const data = {
    strategy_name: $('#new-strategy-name').value,
    target: $('#new-strategy-target').value,
    outcome: $('#new-strategy-outcome').value
  };
  
  if (!data.strategy_name) {
    showToast('请输入策略名称', true);
    return;
  }
  
  project.strategies = project.strategies || [];
  project.strategies.push(data);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('策略添加成功');
  loadModuleContent('strategies');
  refreshProjectDashboard();
}

function deleteStrategy(index) {
  if (!confirm('确定删除此策略？')) return;
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project || !project.strategies) return;
  
  project.strategies.splice(index, 1);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('已删除');
  loadModuleContent('strategies');
  refreshProjectDashboard();
}

function renderReflectionsModule(container, project) {
  const reflections = project.reflections || [];
  
  container.innerHTML = `
    <div class="module-section">
      <h3>反思过程</h3>
      
      <div class="category-tabs">
        <button class="category-tab active" onclick="switchReflectionTab('highlights', this)">亮点</button>
        <button class="category-tab" onclick="switchReflectionTab('shortcomings', this)">不足</button>
        <button class="category-tab" onclick="switchReflectionTab('changes', this)">变化项</button>
        <button class="category-tab" onclick="switchReflectionTab('benchmarks', this)">标杆案例</button>
      </div>
      
      <div id="reflections-content">
        ${renderReflectionsByCategory(reflections, '亮点')}
      </div>
    </div>
  `;
}

function renderReflectionsByCategory(reflections, category) {
  const filtered = reflections.filter(r => r.category === category);
  const categoryMap = {
    '亮点': 'highlights',
    '不足': 'shortcomings',
    '变化项': 'changes',
    '标杆案例': 'benchmarks'
  };
  const suffix = categoryMap[category];
  
  return `
    <div id="${suffix}-section">
      <div class="item-list">
        ${filtered.length === 0 ? 
          '<p class="empty-state">该分类下暂无记录</p>' : 
          filtered.map((r, index) => `
            <div class="item-card">
              <h5>事项：${r.item}</h5>
              <p><strong>做法/原因：</strong>${r.practice}</p>
              <p><strong>结果与影响：</strong>${r.impact}</p>
              <p><strong>启发与行动：</strong>${r.insight}</p>
              <button class="btn-small btn-delete" onclick="deleteReflection(${index}, '${category}')" style="margin-top: 10px;">删除</button>
            </div>
          `).join('')
        }
      </div>
      
      <div class="subsection" style="margin-top: 25px;">
        <h4>添加${category}记录</h4>
        <div class="form-group">
          <label>事项</label>
          <input type="text" id="refl-item-${suffix}" placeholder="输入事项">
        </div>
        <div class="form-group">
          <label>${category === '亮点' ? '好的做法' : category === '不足' ? '不足的做法' : category === '变化项' ? '变化原因' : '具体做法'}</label>
          <textarea id="refl-practice-${suffix}" rows="3" placeholder="输入内容"></textarea>
        </div>
        <div class="form-group">
          <label>结果与影响</label>
          <textarea id="refl-impact-${suffix}" rows="3" placeholder="输入结果与影响"></textarea>
        </div>
        <div class="form-group">
          <label>启发与行动</label>
          <textarea id="refl-insight-${suffix}" rows="3" placeholder="输入启发与行动"></textarea>
        </div>
        <button class="btn-primary" onclick="addReflection('${category}')">添加记录</button>
      </div>
    </div>
  `;
}

function switchReflectionTab(tab, btn) {
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  
  const categoryMap = {
    'highlights': '亮点',
    'shortcomings': '不足',
    'changes': '变化项',
    'benchmarks': '标杆案例'
  };
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (project) {
    $('#reflections-content').innerHTML = renderReflectionsByCategory(project.reflections || [], categoryMap[tab]);
  }
}

function addReflection(category) {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) return;
  
  const categoryMap = {
    '亮点': 'highlights',
    '不足': 'shortcomings',
    '变化项': 'changes',
    '标杆案例': 'benchmarks'
  };
  
  const suffix = categoryMap[category];
  const data = {
    category: category,
    item: $(`#refl-item-${suffix}`).value,
    practice: $(`#refl-practice-${suffix}`).value,
    impact: $(`#refl-impact-${suffix}`).value,
    insight: $(`#refl-insight-${suffix}`).value
  };
  
  if (!data.item) {
    showToast('请输入事项', true);
    return;
  }
  
  project.reflections = project.reflections || [];
  project.reflections.push(data);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('记录添加成功');
  
  // Reload current tab
  $('#reflections-content').innerHTML = renderReflectionsByCategory(project.reflections, category);
  refreshProjectDashboard();
}

function deleteReflection(index, category) {
  if (!confirm('确定删除此记录？')) return;
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project || !project.reflections) return;
  
  // Find the actual index in the full array
  let count = 0;
  for (let i = 0; i < project.reflections.length; i++) {
    if (project.reflections[i].category === category) {
      if (count === index) {
        project.reflections.splice(i, 1);
        break;
      }
      count++;
    }
  }
  
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('已删除');
  $('#reflections-content').innerHTML = renderReflectionsByCategory(project.reflections, category);
  refreshProjectDashboard();
}

function renderSummariesModule(container, project) {
  const summaries = project.summaries || { insights: [], actions: [] };
  
  container.innerHTML = `
    <div class="module-section">
      <h3>总结规律</h3>
      
      <div class="subsection">
        <h4>领悟 / 规律 / 行为</h4>
        <div class="form-group">
          <label>类型</label>
          <select id="insight-type">
            <option value="领悟">领悟</option>
            <option value="规律">规律</option>
            <option value="行为">行为</option>
          </select>
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea id="insight-content" rows="3" placeholder="输入内容"></textarea>
        </div>
        <button class="btn-primary" onclick="addInsight()">添加</button>
        
        <div id="insights-list" style="margin-top: 20px;">
          ${renderInsightsList(summaries.insights)}
        </div>
      </div>
      
      <div class="subsection">
        <h4>行动计划</h4>
        <div class="form-group">
          <label>行动类型</label>
          <select id="action-type">
            <option value="停止行动">停止行动</option>
            <option value="继续行动">继续行动</option>
            <option value="开始行动">开始行动</option>
          </select>
        </div>
        <div class="form-group">
          <label>具体内容</label>
          <textarea id="action-content" rows="3" placeholder="输入具体内容"></textarea>
        </div>
        <button class="btn-primary" onclick="addAction()">添加</button>
        
        <div id="actions-list" style="margin-top: 20px;">
          ${renderActionsList(summaries.actions)}
        </div>
      </div>
    </div>
  `;
}

function renderInsightsList(insights) {
  if (!insights || insights.length === 0) {
    return '<p class="empty-state">暂无记录</p>';
  }
  
  const typeColors = {
    '领悟': '#e74c3c',
    '规律': '#f39c12',
    '行为': '#3498db'
  };
  
  return `
    <div class="item-list">
      ${insights.map((i, index) => `
        <div class="item-card" style="border-left-color: ${typeColors[i.insight_type] || '#3498db'}">
          <span style="display: inline-block; padding: 2px 8px; background: ${typeColors[i.insight_type] || '#3498db'}; color: white; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">${i.insight_type}</span>
          <p>${i.content}</p>
          <button class="btn-small btn-delete" onclick="deleteInsight(${index})" style="margin-top: 10px;">删除</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderActionsList(actions) {
  if (!actions || actions.length === 0) {
    return '<p class="empty-state">暂无行动计划</p>';
  }
  
  const typeColors = {
    '停止行动': '#e74c3c',
    '继续行动': '#27ae60',
    '开始行动': '#3498db'
  };
  
  return `
    <div class="item-list">
      ${actions.map((a, index) => `
        <div class="item-card" style="border-left-color: ${typeColors[a.action_type] || '#3498db'}">
          <span style="display: inline-block; padding: 2px 8px; background: ${typeColors[a.action_type] || '#3498db'}; color: white; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">${a.action_type}</span>
          <p>${a.content}</p>
          <button class="btn-small btn-delete" onclick="deleteAction(${index})" style="margin-top: 10px;">删除</button>
        </div>
      `).join('')}
    </div>
  `;
}

function addInsight() {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) return;
  
  const data = {
    insight_type: $('#insight-type').value,
    content: $('#insight-content').value
  };
  
  if (!data.content) {
    showToast('请输入内容', true);
    return;
  }
  
  project.summaries = project.summaries || { insights: [], actions: [] };
  project.summaries.insights.push(data);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('添加成功');
  loadModuleContent('summaries');
  refreshProjectDashboard();
}

function addAction() {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) return;
  
  const data = {
    action_type: $('#action-type').value,
    content: $('#action-content').value
  };
  
  if (!data.content) {
    showToast('请输入内容', true);
    return;
  }
  
  project.summaries = project.summaries || { insights: [], actions: [] };
  project.summaries.actions.push(data);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('添加成功');
  loadModuleContent('summaries');
  refreshProjectDashboard();
}

function deleteInsight(index) {
  if (!confirm('确定删除？')) return;
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project || !project.summaries?.insights) return;
  
  project.summaries.insights.splice(index, 1);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('已删除');
  loadModuleContent('summaries');
  refreshProjectDashboard();
}

function deleteAction(index) {
  if (!confirm('确定删除？')) return;
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project || !project.summaries?.actions) return;
  
  project.summaries.actions.splice(index, 1);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  showToast('已删除');
  loadModuleContent('summaries');
  refreshProjectDashboard();
}

function refreshProjectDashboard() {
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (project) {
    updateModuleCards(project);
  }
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function createNewProject() {
  showProjectDetail(null);
}

function goBack() {
  showProjectList();
}

function showReports() {
  showToast('报表功能开发中...');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showDashboard();
});

// Data Export/Import for backup
function exportData() {
  const db = getDB();
  const dataStr = JSON.stringify(db, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aactp-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据导出成功');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.projects && Array.isArray(data.projects)) {
        saveDB(data);
        showToast('数据导入成功');
        loadDashboardData();
      } else {
        showToast('数据格式错误', true);
      }
    } catch (err) {
      showToast('文件解析失败', true);
    }
  };
  reader.readAsText(file);
}
