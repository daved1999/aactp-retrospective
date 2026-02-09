# 🚀 GitHub上传与自动构建指南

## 目标：让GitHub Actions自动为你构建APK

---

## 📋 前置条件

1. ✅ Git已安装（通常已预装）
2. ⏳ GitHub账号（待创建）
3. ⏳ 上传项目（待执行）
4. ⏳ 等待构建（自动）

---

## 步骤一：创建GitHub账号

### 如果你还没有GitHub账号：

1. 访问 https://github.com
2. 点击 "Sign up"
3. 输入邮箱、密码、用户名
4. 验证邮箱
5. 完成注册

**时间：** 3-5分钟

---

## 步骤二：创建新仓库

1. 登录GitHub
2. 点击右上角 **+** 号 → **New repository**
3. 填写信息：
   - **Repository name**: `aactp-retrospective`
   - **Description**: AACTP项目复盘画布 - Android离线版
   - **Visibility**: Public（推荐，免费）
   - ✅ **Initialize this repository with**: Add a README（可选）
4. 点击 **Create repository**

**时间：** 1分钟

---

## 步骤三：准备本地项目

### 我已经为你准备好了：

✅ `.gitignore` - 已配置好，排除不需要的文件  
✅ GitHub Actions工作流 - 在 `.github/workflows/build-android.yml`  
✅ 所有源代码 - 已就绪

---

## 步骤四：执行Git命令上传

### 打开终端/命令行

**Windows:**
```cmd
# 方式1: 在项目文件夹右键 → Git Bash Here
# 方式2: CMD或PowerShell，cd到项目目录
```

**Mac/Linux:**
```bash
# 打开Terminal，cd到项目目录
cd /path/to/your/project
```

### 执行以下命令：

```bash
# 1. 初始化Git仓库
git init

# 2. 添加所有文件（排除.gitignore中的）
git add .

# 3. 提交更改
git commit -m "Initial commit: AACTP Retrospective Android App"

# 4. 重命名分支为main
git branch -M main

# 5. 连接远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/aactp-retrospective.git

# 6. 推送到GitHub
git push -u origin main
```

### 示例（假设用户名是 zhangsan）：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/zhangsan/aactp-retrospective.git
git push -u origin main
```

**时间：** 2-3分钟（取决于网络）

---

## 步骤五：等待自动构建

### 观察构建过程：

1. 推送完成后，刷新GitHub页面
2. 点击顶部的 **Actions** 标签
3. 你会看到 "Build Android APK" 正在运行（黄色圆圈）
4. 等待构建完成（约5-10分钟）

### 构建流程：

```
开始构建
  ↓
设置JDK 17
  ↓
设置Android SDK
  ↓
复制前端文件
  ↓
构建Debug APK
  ↓
构建Release APK
  ↓
上传Artifacts
  ↓
完成！✅
```

**时间：** 5-10分钟

---

## 步骤六：下载APK

### 方法一：从Actions下载（推荐）

1. 在Actions页面，点击最新的工作流运行
2. 滚动到页面底部的 "Artifacts" 部分
3. 看到两个文件：
   - **AACTP-Retrospective-Debug** (调试版，推荐测试用)
   - **AACTP-Retrospective-Release** (发布版，未签名)
4. 点击下载ZIP文件
5. 解压ZIP，得到 `app-debug.apk` 或 `app-release-unsigned.apk`

### 方法二：从Releases下载

如果配置了自动发布：
1. 点击仓库的 **Releases** 标签
2. 查看最新版本
3. 下载APK文件

---

## 步骤七：安装到手机

### 1. 传输APK到手机

**方法A - USB传输：**
- 用USB线连接手机和电脑
- 复制APK到手机Download文件夹

**方法B - 微信/QQ文件传输：**
- 发送APK文件给自己
- 在手机上下载

**方法C - 云盘：**
- 上传到百度网盘/阿里云盘
- 手机下载

### 2. 允许安装未知来源应用

**Android 8.0+：**
1. 设置 → 应用 → 特殊访问权限 → 安装未知应用
2. 选择你的文件管理器或浏览器
3. 允许 "从此来源安装应用"

**Android 7.0及以下：**
1. 设置 → 安全
2. 开启 "未知来源" 或 "允许安装未知来源应用"

### 3. 安装APK

1. 在文件管理器中找到APK文件
2. 点击APK文件
3. 点击 "安装"
4. 等待安装完成

### 4. 打开应用

- 在桌面或应用列表中找到 "AACTP项目复盘"
- 点击图标打开
- 开始使用！

---

## 🎉 完成！

现在你可以：
- ✅ 完全离线使用
- ✅ 创建复盘项目
- ✅ 填写四大模块
- ✅ 导出/导入数据备份

---

## 🔄 后续更新

当你修改代码后，重新构建：

```bash
# 修改代码后...
git add .
git commit -m "Update: 描述你的更改"
git push origin main

# GitHub Actions会自动重新构建
# 5-10分钟后下载新的APK
```

---

## ⚠️ 常见问题

### Q1: git命令不存在？
**A:** 安装Git
- Windows: https://git-scm.com/download/win
- Mac: `brew install git` 或下载安装包
- Linux: `sudo apt install git`

### Q2: 推送时提示认证失败？
**A:** 需要使用Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens
2. 生成新token（勾选repo权限）
3. 使用token作为密码推送

### Q3: Actions构建失败？
**A:** 查看日志
1. 点击Actions → 失败的构建
2. 查看具体错误信息
3. 常见问题：
   - 依赖下载失败（网络问题，重试即可）
   - 文件缺失（检查是否所有文件都已提交）

### Q4: 下载的APK无法安装？
**A:** 检查Android版本
- 需要Android 7.0 (API 24) 或更高
- 确保允许安装未知来源应用

### Q5: 如何更新应用？
**A:** 直接安装新版本APK
- Android会自动覆盖旧版本
- 数据不会丢失（除非卸载应用）

---

## 📞 获取帮助

如果在上传或构建过程中遇到问题：

1. **查看GitHub Actions日志**
   - 点击失败的构建
   - 查看详细错误信息

2. **检查文档**
   - `获取APK的3种方法.md`
   - `mobile/BUILD_GUIDE.md`

3. **重新上传**
   ```bash
   git add .
   git commit -m "Fix: 修复问题"
   git push origin main
   ```

4. **联系支持**
   - GitHub社区论坛
   - Stack Overflow

---

## ⏱️ 时间预估

| 步骤 | 时间 | 说明 |
|------|------|------|
| 创建GitHub账号 | 3-5分钟 | 如果需要 |
| 创建仓库 | 1分钟 | - |
| 执行Git命令 | 2-3分钟 | 取决于网络 |
| 等待构建 | 5-10分钟 | 自动化 |
| 下载APK | 1分钟 | - |
| 安装应用 | 2分钟 | - |
| **总计** | **15-25分钟** | - |

---

## ✅ 检查清单

上传前确认：
- [ ] 已创建GitHub账号
- [ ] 已创建仓库
- [ ] 已安装Git（或Git Bash）
- [ ] 在项目根目录执行命令

上传后确认：
- [ ] Actions页面显示构建中
- [ ] 构建成功（绿色勾）
- [ ] 成功下载APK文件
- [ ] APK成功安装到手机
- [ ] 应用可以正常打开

---

## 🎊 开始行动吧！

按照上述步骤，15-25分钟后你就能在手机上使用AACTP项目复盘画布了！

**第一步：创建GitHub账号 → https://github.com**

有任何问题，随时查看文档或寻求帮助！

**祝你成功！🚀**
