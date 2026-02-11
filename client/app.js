// AACTP Project Review Canvas - Main Application
const API = 'http://localhost:5000/api';

let currentProjectId = null;
let currentModule = null;
let statsChart = null;

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

async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, true);
    throw error;
  }
}

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
    // New project
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
async function loadDashboardData() {
  try {
    const data = await fetchJSON(`${API}/dashboard`);
    
    // Update stats
    $('#total-projects').textContent = data.statistics.total_projects;
    $('#total-goals').textContent = data.statistics.total_goals;
    $('#total-strategies').textContent = data.statistics.total_strategies;
    $('#total-reflections').textContent = data.statistics.total_reflections;
    $('#total-insights').textContent = data.statistics.total_insights;
    $('#total-actions').textContent = data.statistics.total_actions;
    
    // Update chart
    updateStatsChart(data.statistics);
    
    // Update recent projects
    renderRecentProjects(data.recent_projects);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
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
    <div class="recent-item" onclick="showProjectDetail(${project.id})">
      <h4>${project.name}</h4>
      <p>${project.enterprise || '未填写企业'} · ${formatDate(project.review_date) || '未设置日期'}</p>
    </div>
  `).join('');
}

// Project Functions
async function loadProjects() {
  try {
    const projects = await fetchJSON(`${API}/projects`);
    renderProjectsList(projects);
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
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
    <div class="project-card" onclick="showProjectDetail(${project.id})">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <h3>${project.name}</h3>
        ${project.completed ? '<span class="status-badge completed">已完成</span>' : '<span class="status-badge">进行中</span>'}
      </div>
      <p>${project.enterprise || '未填写企业'}</p>
      <p>编码: ${project.project_code || '未设置'}</p>
      <div class="project-meta">
        <span>📅 ${formatDate(project.review_date) || '未设置日期'}</span>
        <span>🕐 ${formatDateTime(project.updatedAt)}</span>
      </div>
    </div>
  `).join('');
}

async function loadProjectDetail(projectId) {
  try {
    const project = await fetchJSON(`${API}/projects/${projectId}`);
    $('#project-title').textContent = project.name;
    $('#project-enterprise').value = project.enterprise || '';
    $('#project-name').value = project.name || '';
    $('#project-code').value = project.project_code || '';
    $('#project-date').value = project.review_date || '';
    $('#project-completed').checked = project.completed || false;
    
    // Load dashboard data for this project
    const dashboard = await fetchJSON(`${API}/projects/${projectId}/dashboard`);
    updateModuleCards(dashboard);
  } catch (error) {
    console.error('Failed to load project:', error);
  }
}

// 切换项目完成状态
async function toggleProjectCompletion() {
  if (!currentProjectId) return;
  
  const isCompleted = $('#project-completed').checked;
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}`, {
      method: 'PUT',
      body: JSON.stringify({
        completed: isCompleted
      })
    });
    showToast(isCompleted ? '项目已标记为完成' : '项目已标记为未完成');
    loadDashboardData();
  } catch (error) {
    console.error('Failed to update completion status:', error);
    showToast('更新失败，请重试', true);
  }
}

function updateModuleCards(dashboard) {
  // Goals
  const goalsCount = dashboard.goals.stage_goals;
  $('#goals-count').textContent = `${goalsCount} 个阶段目标`;
  $('#goals-status').textContent = dashboard.goals.main_defined ? '已填写' : '未填写';
  $('#goals-status').className = `module-status ${dashboard.goals.main_defined ? 'completed' : ''}`;
  
  // Strategies
  $('#strategies-count').textContent = `${dashboard.strategies} 个策略`;
  $('#strategies-status').textContent = dashboard.strategies > 0 ? '已填写' : '未填写';
  $('#strategies-status').className = `module-status ${dashboard.strategies > 0 ? 'completed' : ''}`;
  
  // Reflections
  $('#reflections-count').textContent = `${dashboard.reflections.total} 条记录`;
  $('#reflections-status').textContent = dashboard.reflections.total > 0 ? '已填写' : '未填写';
  $('#reflections-status').className = `module-status ${dashboard.reflections.total > 0 ? 'completed' : ''}`;
  
  // Summaries
  const summariesCount = dashboard.summaries.insights + dashboard.summaries.actions.total;
  $('#summaries-count').textContent = `${summariesCount} 条规律/计划`;
  $('#summaries-status').textContent = summariesCount > 0 ? '已填写' : '未填写';
  $('#summaries-status').className = `module-status ${summariesCount > 0 ? 'completed' : ''}`;
}

function clearProjectForm() {
  $('#project-enterprise').value = '';
  $('#project-name').value = '';
  $('#project-code').value = '';
  $('#project-date').value = '';
  $('#project-completed').checked = false;
  
  // Reset module cards
  ['goals', 'strategies', 'reflections', 'summaries'].forEach(module => {
    $(`#${module}-status`).textContent = '未填写';
    $(`#${module}-status`).className = 'module-status';
    $(`#${module}-count`).textContent = module === 'goals' ? '0 个阶段目标' : 
                                          module === 'strategies' ? '0 个策略' :
                                          module === 'reflections' ? '0 条记录' : '0 条规律';
  });
}

async function saveProject() {
  const data = {
    enterprise: $('#project-enterprise').value,
    name: $('#project-name').value,
    project_code: $('#project-code').value,
    review_date: $('#project-date').value,
    completed: $('#project-completed').checked
  };
  
  if (!data.name) {
    showToast('请输入项目名称', true);
    return;
  }
  
  try {
    if (currentProjectId) {
      await fetchJSON(`${API}/projects/${currentProjectId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast('项目更新成功');
    } else {
      const result = await fetchJSON(`${API}/projects`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      currentProjectId = result.id;
      $('#project-title').textContent = data.name;
      showToast('项目创建成功');
    }
    loadDashboardData();
  } catch (error) {
    console.error('Failed to save project:', error);
  }
}

async function deleteCurrentProject() {
  if (!currentProjectId) {
    goBack();
    return;
  }
  
  if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) {
    return;
  }
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}`, {
      method: 'DELETE'
    });
    showToast('项目已删除');
    goBack();
    loadDashboardData();
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
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

async function loadModuleContent(module) {
  const container = $('#module-content');
  
  switch (module) {
    case 'goals':
      await loadGoalsModule(container);
      break;
    case 'strategies':
      await loadStrategiesModule(container);
      break;
    case 'reflections':
      await loadReflectionsModule(container);
      break;
    case 'summaries':
      await loadSummariesModule(container);
      break;
  }
}

async function loadGoalsModule(container) {
  if (!currentProjectId) {
    container.innerHTML = '<p class="empty-state">请先保存项目基本信息</p>';
    return;
  }
  
  try {
    const data = await fetchJSON(`${API}/projects/${currentProjectId}/goals`);
    
    container.innerHTML = `
      <div class="module-section">
        <h3>总目标</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>总目标</label>
            <input type="text" id="main-goal" value="${data.main?.main_goal || ''}" placeholder="输入总目标">
          </div>
          <div class="form-group">
            <label>结果</label>
            <input type="text" id="main-result" value="${data.main?.result || ''}" placeholder="输入结果">
          </div>
          <div class="form-group">
            <label>比率 (%)</label>
            <input type="text" id="main-ratio" value="${data.main?.ratio || ''}" placeholder="输入完成比率">
          </div>
        </div>
        <button class="btn-primary" onclick="saveMainGoal()" style="margin-top: 15px;">保存总目标</button>
      </div>
      
      <div class="module-section">
        <h3>阶段目标</h3>
        <div id="stage-goals-list">
          ${renderStageGoalsList(data.stages)}
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
  } catch (error) {
    container.innerHTML = '<p class="empty-state">加载失败</p>';
  }
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
        ${stages.map(stage => `
          <tr>
            <td>${stage.stage_goal}</td>
            <td>${stage.result}</td>
            <td>${stage.ratio}%</td>
            <td>
              <button class="btn-small btn-delete" onclick="deleteStageGoal(${stage.id})">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function saveMainGoal() {
  const data = {
    main_goal: $('#main-goal').value,
    result: $('#main-result').value,
    ratio: $('#main-ratio').value
  };
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/goals/main`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('总目标保存成功');
  } catch (error) {
    console.error('Failed to save main goal:', error);
  }
}

async function addStageGoal() {
  const data = {
    stage_goal: $('#new-stage-goal').value,
    result: $('#new-stage-result').value,
    ratio: $('#new-stage-ratio').value
  };
  
  if (!data.stage_goal) {
    showToast('请输入阶段目标', true);
    return;
  }
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/goals/stages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('阶段目标添加成功');
    loadModuleContent('goals');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to add stage goal:', error);
  }
}

async function deleteStageGoal(stageId) {
  if (!confirm('确定删除此阶段目标？')) return;
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/goals/stages/${stageId}`, {
      method: 'DELETE'
    });
    showToast('已删除');
    loadModuleContent('goals');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to delete stage goal:', error);
  }
}

async function loadStrategiesModule(container) {
  if (!currentProjectId) {
    container.innerHTML = '<p class="empty-state">请先保存项目基本信息</p>';
    return;
  }
  
  try {
    const strategies = await fetchJSON(`${API}/projects/${currentProjectId}/strategies`);
    
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
  } catch (error) {
    container.innerHTML = '<p class="empty-state">加载失败</p>';
  }
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
        ${strategies.map(s => `
          <tr>
            <td>${s.strategy_name}</td>
            <td>${s.target}</td>
            <td>${s.outcome}</td>
            <td>
              <button class="btn-small btn-delete" onclick="deleteStrategy(${s.id})">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function addStrategy() {
  const data = {
    strategy_name: $('#new-strategy-name').value,
    target: $('#new-strategy-target').value,
    outcome: $('#new-strategy-outcome').value
  };
  
  if (!data.strategy_name) {
    showToast('请输入策略名称', true);
    return;
  }
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/strategies`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('策略添加成功');
    loadModuleContent('strategies');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to add strategy:', error);
  }
}

async function deleteStrategy(strategyId) {
  if (!confirm('确定删除此策略？')) return;
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/strategies/${strategyId}`, {
      method: 'DELETE'
    });
    showToast('已删除');
    loadModuleContent('strategies');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to delete strategy:', error);
  }
}

async function loadReflectionsModule(container) {
  if (!currentProjectId) {
    container.innerHTML = '<p class="empty-state">请先保存项目基本信息</p>';
    return;
  }
  
  try {
    const reflections = await fetchJSON(`${API}/projects/${currentProjectId}/reflections`);
    
    container.innerHTML = `
      <div class="module-section">
        <h3>反思过程</h3>
        
        <div class="category-tabs">
          <button class="category-tab active" onclick="switchReflectionTab('highlights')">亮点</button>
          <button class="category-tab" onclick="switchReflectionTab('shortcomings')">不足</button>
          <button class="category-tab" onclick="switchReflectionTab('changes')">变化项</button>
          <button class="category-tab" onclick="switchReflectionTab('benchmarks')">标杆案例</button>
        </div>
        
        <div id="reflections-content">
          ${renderReflectionsByCategory(reflections, '亮点')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p class="empty-state">加载失败</p>';
  }
}

function renderReflectionsByCategory(reflections, category) {
  const categoryMap = {
    '亮点': 'highlights',
    '不足': 'shortcomings',
    '变化项': 'changes',
    '标杆案例': 'benchmarks'
  };
  
  const filtered = reflections.filter(r => r.category === category);
  
  return `
    <div id="${categoryMap[category]}-section">
      <div class="item-list">
        ${filtered.length === 0 ? 
          '<p class="empty-state">该分类下暂无记录</p>' : 
          filtered.map(r => `
            <div class="item-card">
              <h5>事项：${r.item}</h5>
              <p><strong>做法/原因：</strong>${r.practice}</p>
              <p><strong>结果与影响：</strong>${r.impact}</p>
              <p><strong>启发与行动：</strong>${r.insight}</p>
              <button class="btn-small btn-delete" onclick="deleteReflection(${r.id})" style="margin-top: 10px;">删除</button>
            </div>
          `).join('')
        }
      </div>
      
      <div class="subsection" style="margin-top: 25px;">
        <h4>添加${category}记录</h4>
        <div class="form-group">
          <label>事项</label>
          <input type="text" id="refl-item-${categoryMap[category]}" placeholder="输入事项">
        </div>
        <div class="form-group">
          <label>${category === '亮点' ? '好的做法' : category === '不足' ? '不足的做法' : category === '变化项' ? '变化原因' : '具体做法'}</label>
          <textarea id="refl-practice-${categoryMap[category]}" rows="3" placeholder="输入内容"></textarea>
        </div>
        <div class="form-group">
          <label>结果与影响</label>
          <textarea id="refl-impact-${categoryMap[category]}" rows="3" placeholder="输入结果与影响"></textarea>
        </div>
        <div class="form-group">
          <label>启发与行动</label>
          <textarea id="refl-insight-${categoryMap[category]}" rows="3" placeholder="输入启发与行动"></textarea>
        </div>
        <button class="btn-primary" onclick="addReflection('${category}')">添加记录</button>
      </div>
    </div>
  `;
}

function switchReflectionTab(tab) {
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const categoryMap = {
    'highlights': '亮点',
    'shortcomings': '不足',
    'changes': '变化项',
    'benchmarks': '标杆案例'
  };
  
  loadReflectionsContent(categoryMap[tab]);
}

async function loadReflectionsContent(category) {
  try {
    const reflections = await fetchJSON(`${API}/projects/${currentProjectId}/reflections`);
    $('#reflections-content').innerHTML = renderReflectionsByCategory(reflections, category);
  } catch (error) {
    console.error('Failed to load reflections:', error);
  }
}

async function addReflection(category) {
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
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/reflections`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('记录添加成功');
    loadReflectionsContent(category);
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to add reflection:', error);
  }
}

async function deleteReflection(reflectionId) {
  if (!confirm('确定删除此记录？')) return;
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/reflections/${reflectionId}`, {
      method: 'DELETE'
    });
    showToast('已删除');
    // Reload current tab
    const activeTab = document.querySelector('.category-tab.active');
    if (activeTab) activeTab.click();
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to delete reflection:', error);
  }
}

async function loadSummariesModule(container) {
  if (!currentProjectId) {
    container.innerHTML = '<p class="empty-state">请先保存项目基本信息</p>';
    return;
  }
  
  try {
    const data = await fetchJSON(`${API}/projects/${currentProjectId}/summaries`);
    
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
            ${renderInsightsList(data.insights)}
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
            ${renderActionsList(data.actions)}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p class="empty-state">加载失败</p>';
  }
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
      ${insights.map(i => `
        <div class="item-card" style="border-left-color: ${typeColors[i.insight_type] || '#3498db'}">
          <span style="display: inline-block; padding: 2px 8px; background: ${typeColors[i.insight_type] || '#3498db'}; color: white; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">${i.insight_type}</span>
          <p>${i.content}</p>
          <button class="btn-small btn-delete" onclick="deleteInsight(${i.id})" style="margin-top: 10px;">删除</button>
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
      ${actions.map(a => `
        <div class="item-card" style="border-left-color: ${typeColors[a.action_type] || '#3498db'}">
          <span style="display: inline-block; padding: 2px 8px; background: ${typeColors[a.action_type] || '#3498db'}; color: white; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">${a.action_type}</span>
          <p>${a.content}</p>
          <button class="btn-small btn-delete" onclick="deleteAction(${a.id})" style="margin-top: 10px;">删除</button>
        </div>
      `).join('')}
    </div>
  `;
}

async function addInsight() {
  const data = {
    insight_type: $('#insight-type').value,
    content: $('#insight-content').value
  };
  
  if (!data.content) {
    showToast('请输入内容', true);
    return;
  }
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/summaries/insights`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('添加成功');
    loadModuleContent('summaries');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to add insight:', error);
  }
}

async function addAction() {
  const data = {
    action_type: $('#action-type').value,
    content: $('#action-content').value
  };
  
  if (!data.content) {
    showToast('请输入内容', true);
    return;
  }
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/summaries/actions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showToast('添加成功');
    loadModuleContent('summaries');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to add action:', error);
  }
}

async function deleteInsight(insightId) {
  if (!confirm('确定删除？')) return;
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/summaries/insights/${insightId}`, {
      method: 'DELETE'
    });
    showToast('已删除');
    loadModuleContent('summaries');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to delete insight:', error);
  }
}

async function deleteAction(actionId) {
  if (!confirm('确定删除？')) return;
  
  try {
    await fetchJSON(`${API}/projects/${currentProjectId}/summaries/actions/${actionId}`, {
      method: 'DELETE'
    });
    showToast('已删除');
    loadModuleContent('summaries');
    refreshProjectDashboard();
  } catch (error) {
    console.error('Failed to delete action:', error);
  }
}

async function refreshProjectDashboard() {
  if (currentProjectId) {
    const dashboard = await fetchJSON(`${API}/projects/${currentProjectId}/dashboard`);
    updateModuleCards(dashboard);
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

// 搜索项目
async function searchProjects() {
  try {
    // 获取所有项目
    const projects = await fetchJSON(`${API}/projects`);
    
    // 获取查询条件
    const startDate = $('#search-start-date')?.value;
    const endDate = $('#search-end-date')?.value;
    const keyword = $('#search-keyword')?.value?.trim().toLowerCase();
    const completedFilter = $('#search-completed')?.value;

    console.log('查询条件:', { startDate, endDate, keyword, completedFilter });
    console.log('总项目数:', projects.length);

    let filteredProjects = [...projects];

    // 按日期段查询
    if (startDate || endDate) {
      console.log('按日期过滤:', { startDate, endDate });
      filteredProjects = filteredProjects.filter(project => {
        if (!project.review_date) {
          console.log('项目无日期:', project.name);
          return false;
        }

        const projectDate = new Date(project.review_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // 设置时间为当天的开始和结束，确保包含整天
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        let match = true;
        if (start && end) {
          match = projectDate >= start && projectDate <= end;
        } else if (start) {
          match = projectDate >= start;
        } else if (end) {
          match = projectDate <= end;
        }
        
        console.log(`项目 ${project.name} 日期 ${project.review_date} 匹配: ${match}`);
        return match;
      });
    }

    // 按项目名称关键词查询
    if (keyword) {
      console.log('按关键词过滤:', keyword);
      filteredProjects = filteredProjects.filter(project => {
        const nameMatch = project.name?.toLowerCase().includes(keyword);
        const enterpriseMatch = project.enterprise?.toLowerCase().includes(keyword);
        const codeMatch = project.project_code?.toLowerCase().includes(keyword);
        const match = nameMatch || enterpriseMatch || codeMatch;
        console.log(`项目 ${project.name} 关键词匹配: ${match}`);
        return match;
      });
    }

    // 按完成状态查询
    if (completedFilter !== '') {
      const isCompleted = completedFilter === 'true';
      console.log('按完成状态过滤:', isCompleted);
      filteredProjects = filteredProjects.filter(project => {
        // 处理 completed 字段可能为 undefined 的情况
        const projectCompleted = project.completed === true || project.completed === 'true' || project.completed === 1;
        const match = projectCompleted === isCompleted;
        console.log(`项目 ${project.name} 完成状态 ${project.completed} 匹配: ${match}`);
        return match;
      });
    }

    console.log('过滤后项目数:', filteredProjects.length);

    // 渲染查询结果
    renderProjectsList(filteredProjects);

    // 显示查询结果统计
    showToast(`查询完成，找到 ${filteredProjects.length} 个项目`);
  } catch (error) {
    console.error('搜索失败:', error);
    showToast('搜索失败: ' + (error.message || '请检查网络连接'), true);
  }
}

// 重置查询条件
function resetSearch() {
  // 清空查询条件
  if ($('#search-start-date')) $('#search-start-date').value = '';
  if ($('#search-end-date')) $('#search-end-date').value = '';
  if ($('#search-keyword')) $('#search-keyword').value = '';
  if ($('#search-completed')) $('#search-completed').value = '';

  // 重新加载所有项目
  loadProjects();

  showToast('查询条件已重置');
}

// Data Export/Import for backup
async function exportData() {
  try {
    // Fetch all projects
    const projects = await fetchJSON(`${API}/projects`);
    
    // Create export data structure
    const exportData = {
      projects: [],
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Fetch details for each project
    for (const project of projects) {
      const projectDetail = await fetchJSON(`${API}/projects/${project.id}`);
      const dashboard = await fetchJSON(`${API}/projects/${project.id}/dashboard`);
      
      exportData.projects.push({
        ...projectDetail,
        dashboard: dashboard
      });
    }
    
    // Download as JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zqm-aactp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据导出成功');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('数据导出失败', true);
  }
}

async function importData(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.projects && Array.isArray(data.projects)) {
        let importedCount = 0;
        
        // Import each project
        for (const project of data.projects) {
          try {
            // Create project without id
            const { id, dashboard, ...projectData } = project;
            await fetchJSON(`${API}/projects`, {
              method: 'POST',
              body: JSON.stringify(projectData)
            });
            importedCount++;
          } catch (err) {
            console.error('Failed to import project:', err);
          }
        }
        
        showToast(`成功导入 ${importedCount} 个项目`);
        loadDashboardData();
        loadProjects();
      } else {
        showToast('数据格式错误', true);
      }
    } catch (err) {
      showToast('文件解析失败', true);
    }
  };
  reader.readAsText(file);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showDashboard();
});
