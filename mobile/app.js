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
    document.body.classList.remove('sidebar-collapsed'); // 桌面端展开侧边栏
  }
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
  
  // 桌面端（宽度>767px）隐藏侧边栏时，添加collapsed类使主内容区居中
  if (window.innerWidth > 767) {
    document.body.classList.add('sidebar-collapsed');
  }
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
  } else if (view === 'create') {
    document.querySelector('.nav-item:nth-child(3)').classList.add('active');
  } else if (view === 'help') {
    document.querySelector('.nav-item:nth-child(4)').classList.add('active');
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
  
  container.innerHTML = projects.map(project => {
    const completionBadge = project.completed
      ? '<span style="display: inline-block; padding: 2px 8px; background: #27ae60; color: white; border-radius: 4px; font-size: 12px; margin-left: 8px;">已完成</span>'
      : '<span style="display: inline-block; padding: 2px 8px; background: #95a5a6; color: white; border-radius: 4px; font-size: 12px; margin-left: 8px;">进行中</span>';

    return `
    <div class="project-card" onclick="showProjectDetail('${project.id}')">
      <h3>${project.name}${completionBadge}</h3>
      <p>${project.enterprise || '未填写企业'}</p>
      <p>编码: ${project.project_code || '未设置'}</p>
      <div class="project-meta">
        <span>📅 ${formatDate(project.review_date) || '未设置日期'}</span>
        <span>🕐 ${formatDateTime(project.updatedAt)}</span>
      </div>
    </div>
  `}).join('');
}

// 查询项目功能
function searchProjects() {
  const db = getDB();
  let projects = db.projects || [];

  // 获取查询条件
  const startDate = $('#search-start-date')?.value;
  const endDate = $('#search-end-date')?.value;
  const keyword = $('#search-keyword')?.value?.trim().toLowerCase();
  const completedFilter = $('#search-completed')?.value;

  let filteredProjects = [...projects];

  // 按日期段查询
  if (startDate || endDate) {
    filteredProjects = filteredProjects.filter(project => {
      if (!project.review_date) return false;

      const projectDate = new Date(project.review_date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // 设置时间为当天的开始和结束，确保包含整天
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (start && end) {
        return projectDate >= start && projectDate <= end;
      } else if (start) {
        return projectDate >= start;
      } else if (end) {
        return projectDate <= end;
      }
      return true;
    });
  }

  // 按项目名称关键词查询
  if (keyword) {
    filteredProjects = filteredProjects.filter(project => {
      const nameMatch = project.name?.toLowerCase().includes(keyword);
      const enterpriseMatch = project.enterprise?.toLowerCase().includes(keyword);
      const codeMatch = project.project_code?.toLowerCase().includes(keyword);
      return nameMatch || enterpriseMatch || codeMatch;
    });
  }

  // 按完成状态查询
  if (completedFilter !== '') {
    const isCompleted = completedFilter === 'true';
    filteredProjects = filteredProjects.filter(project => {
      return project.completed === isCompleted;
    });
  }

  // 渲染查询结果
  renderProjectsList(filteredProjects);

  // 显示查询结果统计
  showToast(`查询完成，找到 ${filteredProjects.length} 个项目`);
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
  $('#project-completed').checked = project.completed || false;
  
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
    review_date: $('#project-date').value,
    completed: $('#project-completed')?.checked || false
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

// 切换项目完成状态
function toggleProjectCompletion() {
  const db = getDB();
  const isCompleted = $('#project-completed').checked;

  if (currentProjectId) {
    const index = db.projects.findIndex(p => p.id === currentProjectId);
    if (index !== -1) {
      db.projects[index].completed = isCompleted;
      db.projects[index].updatedAt = new Date().toISOString();
      saveDB(db);
      showToast(isCompleted ? '项目已标记为完成' : '项目已标记为未完成');
    }
  }
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
async function openModule(module) {
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
  await loadModuleContent(module);
}

function closeModule() {
  showProjectDetail(currentProjectId);
}

async function loadModuleContent(module) {
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
      await renderReflectionsModule(container, project);
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

async function renderReflectionsModule(container, project) {
  const reflections = project.reflections || [];
  
  // 异步加载亮点分类的图片
  const highlightsHtml = await renderReflectionsByCategory(reflections, '亮点');
  
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
        ${highlightsHtml}
      </div>
    </div>
  `;
}

async function renderReflectionsByCategory(reflections, category) {
  const filtered = reflections.filter(r => r.category === category);
  const categoryMap = {
    '亮点': 'highlights',
    '不足': 'shortcomings',
    '变化项': 'changes',
    '标杆案例': 'benchmarks'
  };
  const suffix = categoryMap[category];
  
  // 获取该类别的图片ID
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  const categoryImageIds = project?.reflectionImages?.[suffix] || [];
  
  // 异步加载所有图片
  const imagesHtml = await Promise.all(categoryImageIds.map(async (imageId, index) => {
    const imageData = await loadImage(imageId);
    if (imageData) {
      return `
        <div class="image-item" data-image-id="${imageId}">
          <img src="${imageData}" alt="${category}图片" onclick="viewImage('${imageData}')">
          <button class="image-delete-btn" onclick="deleteImageFromCategory('${suffix}', ${index}, '${imageId}')">✕</button>
        </div>
      `;
    }
    return '';
  }));
  
  return `
    <div id="${suffix}-section">
      <!-- 图片展示区域 -->
      <div class="image-section">
        <div class="image-section-header">
          <h4>📷 ${category}插图</h4>
          <button class="btn-small btn-edit" onclick="selectImagesForCategory('${suffix}')">➕ 添加插图</button>
          <input type="file" id="image-input-${suffix}" accept="image/*" multiple style="display: none;" onchange="handleImagesSelected('${suffix}', this)">
        </div>
        <div class="image-grid" id="image-grid-${suffix}">
          ${categoryImageIds.length === 0 ? 
            '<div class="empty-state-wrapper"><p class="empty-state">暂无插图，点击上方按钮添加</p></div>' :
            imagesHtml.join('')
          }
        </div>
      </div>
      
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

async function switchReflectionTab(tab, btn) {
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
    const html = await renderReflectionsByCategory(project.reflections || [], categoryMap[tab]);
    $('#reflections-content').innerHTML = html;
  }
}

async function addReflection(category) {
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
  const html = await renderReflectionsByCategory(project.reflections, category);
  $('#reflections-content').innerHTML = html;
  refreshProjectDashboard();
}

async function deleteReflection(index, category) {
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
  const html = await renderReflectionsByCategory(project.reflections, category);
  $('#reflections-content').innerHTML = html;
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
  updateActiveNav('create');
}

function goBack() {
  showProjectList();
}

function showReports() {
  showToast('报表功能开发中...');
}

// ==================== 手势滑动功能 ====================

// 导航菜单项配置（按侧边栏顺序）
const navMenuItems = [
  { id: 'dashboard', name: '驾驶舱', action: showDashboard },
  { id: 'projects', name: '项目列表', action: showProjectList },
  { id: 'create', name: '新建复盘', action: createNewProject }
];

// 手势检测变量
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 80; // 最小滑动距离（像素）
const maxSwipeVertical = 100; // 最大垂直偏移（防止误触）

// 获取当前活动视图（映射到菜单项）
function getCurrentView() {
  if (!$('#dashboard-view').classList.contains('hidden')) return 'dashboard';
  if (!$('#project-list-view').classList.contains('hidden')) return 'projects';
  if (!$('#project-detail-view').classList.contains('hidden')) {
    // 在项目详情页，根据 currentProjectId 判断是查看还是新建
    // 如果是新建项目（currentProjectId为null），返回'create'以便手势循环
    return currentProjectId ? 'projects' : 'create';
  }
  return 'dashboard';
}

// 切换到下一个菜单项（循环）
function cycleToNextMenu() {
  const currentView = getCurrentView();
  
  // 找到当前菜单项索引
  let currentIndex = navMenuItems.findIndex(item => item.id === currentView);
  if (currentIndex === -1) currentIndex = 0;
  
  // 循环到下一个
  const nextIndex = (currentIndex + 1) % navMenuItems.length;
  const nextItem = navMenuItems[nextIndex];
  
  console.log(`切换到：从 ${navMenuItems[currentIndex].name} 到 ${nextItem.name}`);
  nextItem.action();
  showToast(`切换到：${nextItem.name}`);
}

// 切换到上一个菜单项（循环）
function cycleToPrevMenu() {
  const currentView = getCurrentView();
  
  // 找到当前菜单项索引
  let currentIndex = navMenuItems.findIndex(item => item.id === currentView);
  if (currentIndex === -1) currentIndex = 0;
  
  // 循环到上一个（数组长度减1再取模）
  const prevIndex = (currentIndex - 1 + navMenuItems.length) % navMenuItems.length;
  const prevItem = navMenuItems[prevIndex];
  
  console.log(`切换到：从 ${navMenuItems[currentIndex].name} 到 ${prevItem.name}`);
  prevItem.action();
  showToast(`切换到：${prevItem.name}`);
}

// 处理左滑（切换到下一个菜单项）
function handleSwipeLeft() {
  cycleToNextMenu();
}

// 处理右滑（切换到上一个菜单项）- 现在和左滑功能相同，都是循环切换
function handleSwipeRight() {
  cycleToPrevMenu();
}

// 触摸开始
function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}

// 触摸结束
function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);
  
  // 检查是否为有效滑动手势
  if (absDeltaX < minSwipeDistance || absDeltaY > maxSwipeVertical) {
    return; // 滑动距离太短或垂直偏移太大，忽略
  }
  
  // 判断滑动方向
  if (deltaX < 0) {
    // 左滑
    handleSwipeLeft();
  } else {
    // 右滑
    handleSwipeRight();
  }
}

// 初始化手势监听
document.addEventListener('DOMContentLoaded', () => {
  // 在主内容区域添加手势监听
  const app = document.getElementById('app');
  if (app) {
    app.addEventListener('touchstart', handleTouchStart, { passive: true });
    app.addEventListener('touchend', handleTouchEnd, { passive: true });
    console.log('手势功能已启用：左滑切换菜单，右滑返回');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showDashboard();
  
  // 初始化侧边栏状态（桌面端默认展开）
  if (window.innerWidth > 767) {
    document.body.classList.remove('sidebar-collapsed');
  } else {
    document.body.classList.add('sidebar-collapsed');
  }
});

// 窗口大小改变时调整侧边栏状态
window.addEventListener('resize', () => {
  if (window.innerWidth > 767) {
    // 桌面端默认展开
    document.body.classList.remove('sidebar-collapsed');
  } else {
    // 移动端默认收起
    document.body.classList.add('sidebar-collapsed');
  }
});

// Data Export/Import for backup
async function exportData() {
  try {
    showToast('正在导出数据，请稍候...');
    
    const db = getDB();
    
    // 导出项目数据
    const exportData = {
      ...db,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    // 尝试导出图片数据
    try {
      const images = await getAllImagesFromDB();
      exportData.images = images;
      console.log(`导出 ${images.length} 张图片`);
    } catch (err) {
      console.warn('导出图片失败:', err);
      exportData.images = [];
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const filename = `zqm-aactp-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Check if running in Android WebView with native interface
    if (window.Android && window.Android.exportFile) {
      // Use native Android file export
      const result = window.Android.exportFile(filename, dataStr);
      if (result && result.startsWith('error:')) {
        showToast('导出失败：' + result.substring(7), true);
      } else {
        showToast(`导出成功！包含 ${exportData.images?.length || 0} 张图片`);
      }
    } else {
      // Fallback for browser or other platforms
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        showToast(`导出成功！包含 ${exportData.images?.length || 0} 张图片，文件：${filename}`);
      } else {
        showToast(`数据导出成功，包含 ${exportData.images?.length || 0} 张图片`);
      }
    }
  } catch (err) {
    console.error('Export error:', err);
    showToast('导出失败：' + err.message, true);
  }
}

async function importData(file) {
  if (!file) {
    showToast('请选择文件', true);
    return;
  }
  
  if (!file.name.endsWith('.json')) {
    showToast('请选择 .json 格式的文件', true);
    return;
  }
  
  showToast('正在导入数据，请稍候...');
  
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.projects && Array.isArray(data.projects)) {
        // Confirm before importing
        if (confirm(`确定要导入 ${data.projects.length} 个项目吗？这将覆盖现有数据。`)) {
          // 导入项目数据
          saveDB(data);
          
          // 导入图片数据
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            try {
              await saveAllImagesToDB(data.images);
              showToast(`导入成功！包含 ${data.images.length} 张图片`);
            } catch (err) {
              console.error('导入图片失败:', err);
              showToast('项目数据导入成功，但图片导入失败', true);
            }
          } else {
            showToast('数据导入成功（不包含图片）');
          }
          
          loadDashboardData();
          if (currentProjectId) {
            showDashboard();
          }
        }
      } else {
        showToast('数据格式错误：缺少项目数据', true);
      }
    } catch (err) {
      console.error('Import parse error:', err);
      showToast('文件解析失败：' + err.message, true);
    }
  };
  
  reader.onerror = (e) => {
    console.error('File read error:', e);
    showToast('文件读取失败', true);
  };
  
  reader.readAsText(file);
}

// Alternative import method using input element
function triggerImport() {
  const input = document.getElementById('import-file');
  if (input) {
    input.value = ''; // Reset to allow selecting same file
    input.click();
  } else {
    showToast('导入功能初始化失败', true);
  }
}

// ==================== 图片处理功能 ====================

// IndexedDB 配置
const IMAGE_DB_NAME = 'aactp_images';
const IMAGE_DB_VERSION = 1;
const IMAGE_STORE_NAME = 'images';

// 初始化 IndexedDB
function initImageDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
      };
    };
  });
}

// 保存图片到 IndexedDB
async function saveImageToDB(imageId, imageData) {
  const db = await initImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.put({ id: imageId, data: imageData, timestamp: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 从 IndexedDB 获取图片
async function getImageFromDB(imageId) {
  const db = await initImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.get(imageId);
    request.onsuccess = () => resolve(request.result?.data);
    request.onerror = () => reject(request.error);
  });
}

// 从 IndexedDB 删除图片
async function deleteImageFromDB(imageId) {
  const db = await initImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.delete(imageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 从 IndexedDB 获取所有图片（用于导出）
async function getAllImagesFromDB() {
  const db = await initImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 批量保存图片到 IndexedDB（用于导入）
async function saveAllImagesToDB(images) {
  const db = await initImageDB();
  const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(IMAGE_STORE_NAME);
  
  for (const image of images) {
    store.put(image);
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 为类别选择图片
function selectImagesForCategory(categorySuffix) {
  const input = document.getElementById(`image-input-${categorySuffix}`);
  if (input) {
    input.value = ''; // Reset to allow selecting same files
    input.click();
  } else {
    showToast('图片选择功能初始化失败', true);
  }
}

// 压缩图片
function compressImage(file, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // 如果图片宽度大于最大宽度，等比例缩小
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // 转换为压缩后的 base64
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    img.onerror = reject;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 处理选中的图片
async function handleImagesSelected(categorySuffix, input) {
  if (!input.files || input.files.length === 0) return;
  
  const files = Array.from(input.files);
  const maxFiles = 5; // 最多5张图片
  
  if (files.length > maxFiles) {
    showToast(`最多只能选择${maxFiles}张图片`, true);
    return;
  }
  
  showToast(`正在处理${files.length}张图片，请稍候...`);
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project) {
    showToast('项目不存在', true);
    return;
  }
  
  // Initialize reflectionImages if not exists (只存储图片ID，不存储数据)
  if (!project.reflectionImages) {
    project.reflectionImages = {};
  }
  if (!project.reflectionImages[categorySuffix]) {
    project.reflectionImages[categorySuffix] = [];
  }
  
  try {
    let successCount = 0;
    
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.warn('Skipping non-image file:', file.name);
        continue;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast(`图片 ${file.name} 超过10MB限制`, true);
        continue;
      }
      
      // 生成唯一ID
      const imageId = `${currentProjectId}_${categorySuffix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 压缩图片
      const compressedData = await compressImage(file);
      
      // 保存到 IndexedDB
      await saveImageToDB(imageId, compressedData);
      
      // 只存储ID到 localStorage
      project.reflectionImages[categorySuffix].push(imageId);
      successCount++;
    }
    
    project.updatedAt = new Date().toISOString();
    saveDB(db);
    
    showToast(`成功添加${successCount}张图片`);
    
    // Reload current tab to show new images
    const categoryMap = {
      'highlights': '亮点',
      'shortcomings': '不足',
      'changes': '变化项',
      'benchmarks': '标杆案例'
    };
    const category = categoryMap[categorySuffix];
    const html = await renderReflectionsByCategory(project.reflections || [], category);
    $('#reflections-content').innerHTML = html;
    
  } catch (err) {
    console.error('Image processing error:', err);
    if (err.name === 'QuotaExceededError') {
      showToast('存储空间不足，请删除一些图片后再试', true);
    } else {
      showToast('图片处理失败：' + err.message, true);
    }
  }
}

// 加载图片（从 IndexedDB）
async function loadImage(imageId) {
  try {
    return await getImageFromDB(imageId);
  } catch (err) {
    console.error('Failed to load image:', err);
    return null;
  }
}

// 从类别中删除图片
async function deleteImageFromCategory(categorySuffix, imageIndex, imageId) {
  if (!confirm('确定删除这张图片吗？')) return;
  
  const db = getDB();
  const project = db.projects.find(p => p.id === currentProjectId);
  if (!project || !project.reflectionImages || !project.reflectionImages[categorySuffix]) return;
  
  // 从数组中删除
  project.reflectionImages[categorySuffix].splice(imageIndex, 1);
  project.updatedAt = new Date().toISOString();
  saveDB(db);
  
  // 从 IndexedDB 中删除图片数据
  if (imageId) {
    try {
      await deleteImageFromDB(imageId);
    } catch (err) {
      console.error('Failed to delete image from DB:', err);
    }
  }
  
  showToast('图片已删除');
  
  // Reload current tab
  const categoryMap = {
    'highlights': '亮点',
    'shortcomings': '不足',
    'changes': '变化项',
    'benchmarks': '标杆案例'
  };
  const category = categoryMap[categorySuffix];
  const html = await renderReflectionsByCategory(project.reflections || [], category);
  $('#reflections-content').innerHTML = html;
}

// 查看大图 - 支持双指缩放和拖动
function viewImage(src) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'image-viewer-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.95);
    z-index: 10000;
    overflow: hidden;
    touch-action: none;
  `;
  
  // 创建图片容器
  const container = document.createElement('div');
  container.className = 'image-viewer-container';
  container.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const img = document.createElement('img');
  img.src = src;
  img.className = 'image-viewer-img';
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    color: white;
    font-size: 24px;
    border: 2px solid rgba(255,255,255,0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `;
  closeBtn.onclick = () => {
    document.body.removeChild(modal);
  };
  
  container.appendChild(img);
  modal.appendChild(container);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
  
  // 缩放功能
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let initialDistance = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  
  function updateTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
  
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // 触摸事件
  modal.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }
  }, { passive: true });
  
  modal.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      scale = Math.min(Math.max(currentDistance / initialDistance, 0.5), 4);
      updateTransform();
    } else if (e.touches.length === 1 && isDragging) {
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      updateTransform();
    }
  }, { passive: false });
  
  modal.addEventListener('touchend', () => {
    isDragging = false;
  }, { passive: true });
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === container) {
      document.body.removeChild(modal);
    }
  });
}
