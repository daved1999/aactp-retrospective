# AACTP 项目复盘画布 - 完整版

## 项目概述
基于AACTP项目复盘画布方法论实现的完整复盘工具，严格对照提供的图片实现了所有详细字段和功能。

### 四大核心模块
1. **回顾目标** - 总目标（目标/结果/比率）+ 阶段目标列表
2. **评估策略** - 多个策略（策略名称/目标/结果）
3. **反思过程** - 四个分类（亮点/不足/变化项/标杆案例），每类包含：事项、做法/原因、结果与影响、启发与行动
4. **总结规律** - 领悟/规律/行为 + 行动计划（停止/继续/开始）

## 技术架构
- **后端**: Node.js + Express + SQLite3
- **前端**: 原生JavaScript + Chart.js图表库
- **数据库**: SQLite本地文件存储

## 功能特性

### 驾驶舱（主页面）
- 6个统计卡片展示全局数据
- Chart.js可视化数据分布饼图
- 最近5条复盘记录列表
- 快速入口（新建/查询/报表）

### 项目列表
- 卡片式展示所有项目
- 显示企业名称、项目编码、复盘日期、更新时间
- 点击进入项目详情

### 项目详情
- 基本信息编辑（企业/项目名称/编码/日期）
- 四大模块状态卡片
- 点击模块进入详细录入

### 详细录入界面
- **回顾目标**: 总目标表单 + 阶段目标表格（可增删）
- **评估策略**: 策略列表表格 + 添加表单
- **反思过程**: 分类标签页切换 + 每类独立表单和列表
- **总结规律**: 领悟/规律/行为列表 + 行动计划（三色标签区分）

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
**Windows用户**: 双击运行 `start.bat`

**或命令行启动**:
```bash
node server/server.js
```

### 3. 访问系统
打开浏览器访问: **http://localhost:5000**

## 使用流程

### 第一步：创建项目
1. 点击"新建复盘"或驾驶舱的"新建复盘项目"
2. 填写基本信息（企业名称、项目名称、编码、日期）
3. 点击"保存项目"

### 第二步：录入回顾目标
1. 点击"回顾目标"卡片（红色）
2. 填写总目标、结果、比率
3. 点击"保存总目标"
4. 添加多个阶段目标

### 第三步：录入评估策略
1. 点击"评估策略"卡片（橙色）
2. 添加多个策略（策略名称、目标、结果）

### 第四步：录入反思过程
1. 点击"反思过程"卡片（蓝色）
2. 切换标签：亮点、不足、变化项、标杆案例
3. 在每个分类下添加记录

### 第五步：录入总结规律
1. 点击"总结规律"卡片（绿色）
2. 添加领悟/规律/行为
3. 添加行动计划（停止/继续/开始）

### 第六步：查看统计
返回驾驶舱查看全局统计数据和图表

## API 接口

### 全局接口
```
GET /api/dashboard          # 全局统计 + 最近5个项目
```

### 项目管理
```
GET    /api/projects              # 所有项目
POST   /api/projects              # 创建项目
GET    /api/projects/:id          # 单个项目
PUT    /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
GET    /api/projects/:id/dashboard # 项目仪表板
```

### 回顾目标
```
GET    /api/projects/:id/goals              # 获取目标
POST   /api/projects/:id/goals/main         # 保存总目标
POST   /api/projects/:id/goals/stages       # 添加阶段目标
PUT    /api/projects/:id/goals/stages/:id   # 更新阶段目标
DELETE /api/projects/:id/goals/stages/:id   # 删除阶段目标
```

### 评估策略
```
GET    /api/projects/:id/strategies         # 获取策略
POST   /api/projects/:id/strategies         # 添加策略
PUT    /api/projects/:id/strategies/:id     # 更新策略
DELETE /api/projects/:id/strategies/:id     # 删除策略
```

### 反思过程
```
GET    /api/projects/:id/reflections         # 获取反思
POST   /api/projects/:id/reflections         # 添加反思
PUT    /api/projects/:id/reflections/:id     # 更新反思
DELETE /api/projects/:id/reflections/:id     # 删除反思
```

### 总结规律
```
GET    /api/projects/:id/summaries                    # 获取总结
POST   /api/projects/:id/summaries/insights           # 添加领悟/规律/行为
DELETE /api/projects/:id/summaries/insights/:id       # 删除
POST   /api/projects/:id/summaries/actions            # 添加行动计划
DELETE /api/projects/:id/summaries/actions/:id        # 删除
```

## 数据库表结构

| 表名 | 说明 |
|------|------|
| projects | 项目基本信息 |
| goals_main | 总目标（目标/结果/比率）|
| goals_stages | 阶段目标列表 |
| strategies | 策略（名称/目标/结果）|
| reflections | 反思过程（分类/事项/做法/影响/启发）|
| summaries_insights | 总结规律（类型/内容）|
| summaries_actions | 行动计划（类型/内容）|

## 与图片对照

### 图2-1 项目复盘画布整体结构
✅ 实现了四个模块的卡片式布局
✅ 每个模块对应不同的颜色标识

### 回顾目标详细页
✅ 总目标 - 总目标/结果/比率
✅ 阶段目标 - 阶段目标/结果/比率

### 评估策略详细页
✅ 策略列表 - 策略名称/目标/结果

### 反思过程详细页
✅ 四个分类标签：亮点、不足、变化项、标杆案例
✅ 每类包含：事项、做法/原因、结果与影响、启发与行动

### 总结规律详细页
✅ 领悟/规律/行为列表
✅ 行动计划：停止行动/继续行动/开始行动

## 系统要求

- Node.js >= 14.0
- 现代浏览器（Chrome/Firefox/Edge/Safari）
- 支持响应式布局（桌面端和平板端）

## 文件结构

```
project/
├── server/
│   ├── server.js          # 后端主文件
│   └── db.sqlite          # 数据库文件（自动创建）
├── client/
│   ├── index.html         # 前端页面
│   ├── app.js             # 前端逻辑
│   └── styles.css         # 样式文件
├── package.json           # 项目配置
├── start.bat             # Windows启动脚本
└── README.md             # 本文件
```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 端口5000被占用 | 修改server/server.js中的PORT变量 |
| 无法安装依赖 | 删除node_modules后重试npm install |
| 数据库权限错误 | 确保程序对目录有读写权限 |
| 页面显示异常 | 清除浏览器缓存后刷新 |

## 后续扩展建议

1. **数据导出**: 支持导出Excel/PDF报告
2. **模板功能**: 保存常用设置为模板
3. **多用户**: 添加用户登录和权限管理
4. **数据备份**: 自动备份数据库
5. **打印优化**: 生成可打印的画布PDF
6. **移动端APP**: 开发配套移动应用

## License

MIT License
