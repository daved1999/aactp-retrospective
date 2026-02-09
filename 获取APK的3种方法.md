# 📱 获取AACTP Android APK的3种方法

## 🚀 方法1：GitHub Actions自动构建（最简单，推荐）

### 步骤：

1. **创建GitHub账号**（如果还没有）
   - 访问 https://github.com
   - 注册免费账号

2. **创建新仓库**
   - 点击 "New repository"
   - 仓库名: `aactp-retrospective`
   - 选择 "Public"
   - 点击 "Create repository"

3. **上传项目文件**
   ```bash
   # 在项目根目录执行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/aactp-retrospective.git
   git push -u origin main
   ```

4. **等待自动构建**
   - 进入仓库页面
   - 点击 "Actions" 标签
   - 你会看到 "Build Android APK" 工作流正在运行
   - 等待约5-10分钟

5. **下载APK**
   - 构建完成后，进入 Actions 页面
   - 点击最新的工作流运行记录
   - 在 "Artifacts" 部分找到 "AACTP-Retrospective-Debug"
   - 点击下载ZIP文件
   - 解压后得到 `app-debug.apk`

**优点：**
- ✅ 不需要安装任何软件
- ✅ 全自动构建
- ✅ 每次更新代码自动重新构建

---

## 💻 方法2：本地Windows构建（需要安装软件）

### 准备工作：

1. **安装Java JDK 17**
   - 下载：https://adoptium.net/temurin/releases/?version=17
   - 安装并记住安装路径

2. **安装Android Studio**
   - 下载：https://developer.android.com/studio
   - 安装时选择 "Standard" 配置
   - 等待SDK下载完成（约1-2GB）

3. **配置环境变量**
   ```cmd
   # 右键"此电脑" -> 属性 -> 高级系统设置 -> 环境变量
   
   # 添加 JAVA_HOME
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot
   
   # 添加到 Path
   %JAVA_HOME%\bin
   ```

### 构建步骤：

1. **复制项目到Windows电脑**
   - 将整个项目文件夹复制到桌面

2. **运行构建脚本**
   ```cmd
   cd mobile
   build-apk.bat
   ```

3. **在Android Studio中构建**
   - 等待Android Studio自动打开
   - 等待Gradle同步完成（首次约5-10分钟）
   - 点击菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
   - 等待构建完成

4. **获取APK**
   - 构建完成后，点击右下角弹出的通知
   - 或在文件夹中找到：`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**优点：**
- ✅ 完全控制构建过程
- ✅ 可以自定义和调试
- ✅ 可以生成签名APK用于发布

---

## 🌐 方法3：使用在线APK构建服务

### 推荐服务：

1. **BuildAPK.io**
   - 访问 https://buildapk.io/
   - 上传你的项目压缩包
   - 等待构建完成
   - 下载APK

2. **Appetize.io**（在线预览）
   - 访问 https://appetize.io/
   - 需要先构建APK再上传预览

3. **Flutter Flow**（如果重写为Flutter）
   - 可视化构建Flutter应用
   - 自动生成APK

### 步骤：

1. **打包项目**
   ```bash
   # 只打包mobile目录
   cd mobile
   zip -r aactp-android.zip android/ index.html styles.css app.js
   ```

2. **上传到在线服务**
   - 访问 BuildAPK.io
   - 上传 aactp-android.zip
   - 选择Android版本
   - 开始构建

3. **下载APK**
   - 等待构建完成
   - 下载生成的APK文件

**优点：**
- ✅ 无需安装开发环境
- ✅ 快速方便
- ⚠️ 可能需要付费

---

## 📋 各方法对比

| 方法 | 难度 | 时间 | 成本 | 推荐指数 |
|------|------|------|------|----------|
| GitHub Actions | ⭐ 简单 | 10分钟 | 免费 | ⭐⭐⭐⭐⭐ |
| 本地构建 | ⭐⭐⭐ 复杂 | 30分钟+ | 免费 | ⭐⭐⭐ |
| 在线服务 | ⭐⭐ 中等 | 5-15分钟 | 可能收费 | ⭐⭐⭐ |

---

## 🎯 推荐方案

### 如果你是新手：
**选择方法1（GitHub Actions）**
- 只需要注册GitHub账号
- 上传代码后自动完成所有工作
- 5分钟后拿到APK

### 如果你是开发者：
**选择方法2（本地构建）**
- 学习Android开发流程
- 可以自定义和优化
- 将来可以发布到应用商店

### 如果你想快速测试：
**选择方法3（在线服务）**
- 最快的方案
- 适合临时测试
- 注意隐私和数据安全

---

## 📱 安装APK到手机

### Android设备安装步骤：

1. **开启开发者选项**
   - 设置 → 关于手机 → 连续点击"版本号"7次
   - 返回设置 → 开发者选项 → 开启"USB调试"

2. **允许安装未知来源应用**
   - 设置 → 安全 → 允许安装未知来源应用
   - 或安装时系统会提示，点击"允许"

3. **传输APK到手机**
   - 方法A：使用USB数据线连接电脑，复制APK到手机
   - 方法B：使用微信/QQ的文件传输
   - 方法C：使用云盘（百度网盘、阿里云盘等）

4. **安装APK**
   - 在文件管理器中找到APK文件
   - 点击APK文件
   - 点击"安装"
   - 等待安装完成

5. **打开应用**
   - 在桌面找到 "AACTP项目复盘" 图标
   - 点击打开，开始使用！

---

## 🎉 安装完成！

现在你可以：
- ✅ 创建复盘项目
- ✅ 填写四大模块
- ✅ 查看统计图表
- ✅ 导出/导入数据
- ✅ 完全离线使用

## ⚠️ 注意事项

1. **首次启动**：应用会创建本地数据库，可能需要1-2秒
2. **数据存储**：所有数据保存在手机本地，卸载应用会丢失数据
3. **定期备份**：使用导出功能定期备份数据到云盘
4. **权限要求**：需要存储权限用于导出/导入数据（Android 10及以下）

## 📞 遇到问题？

1. **安装失败**：检查Android版本是否 >= 7.0
2. **无法打开**：检查是否允许安装未知来源应用
3. **数据丢失**：检查是否误删了应用数据
4. **其他问题**：查看 `mobile/BUILD_GUIDE.md` 故障排除章节

---

**祝使用愉快！🎊**
