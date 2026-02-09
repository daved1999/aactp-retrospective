@echo off
chcp 65001 >nul
echo ============================================
echo   AACTP项目复盘 - GitHub上传准备工具
echo ============================================
echo.

cd /d "%~dp0"

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git未安装！
    echo.
    echo 请先安装Git：
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo ✅ Git已安装

echo.
echo ============================================
echo 检查文件完整性...
echo ============================================
echo.

set MISSING=0

if not exist ".gitignore" (
    echo ❌ 缺少 .gitignore
    set MISSING=1
)

if not exist ".github\workflows\build-android.yml" (
    echo ❌ 缺少 GitHub Actions配置
    set MISSING=1
)

if not exist "mobile\index.html" (
    echo ❌ 缺少 mobile/index.html
    set MISSING=1
)

if not exist "mobile\android\app\src\main\AndroidManifest.xml" (
    echo ❌ 缺少 Android项目文件
    set MISSING=1
)

if %MISSING%==1 (
    echo.
    echo ❌ 文件不完整，请检查项目结构
    pause
    exit /b 1
)

echo ✅ 所有文件已就绪！
echo.

REM Check if git is already initialized
if exist ".git" (
    echo ⚠️  Git仓库已初始化
    echo.
    choice /C YN /M "是否重新初始化"
    if errorlevel 2 goto SkipInit
    rmdir /s /q .git
)

echo ============================================
echo 初始化Git仓库...
echo ============================================
git init
echo.

echo ============================================
echo 配置Git（可选）...
echo ============================================
echo.
echo 提示：Git需要配置用户名和邮箱
echo.
set /p CONFIG="是否配置Git用户名和邮箱？(Y/N): "
if /I "%CONFIG%"=="Y" (
    set /p GIT_NAME="输入用户名: "
    set /p GIT_EMAIL="输入邮箱: "
    git config user.name "%GIT_NAME%"
    git config user.email "%GIT_EMAIL%"
    echo ✅ Git配置完成
)
echo.

:SkipInit
echo ============================================
echo 准备提交文件...
echo ============================================
echo.
echo 正在添加文件到Git（排除node_modules等）...
git add .
echo ✅ 文件已添加
echo.

echo ============================================
echo 提交更改...
echo ============================================
git commit -m "Initial commit: AACTP Retrospective Android App"
echo ✅ 提交完成
echo.

echo ============================================
echo 设置分支名...
echo ============================================
git branch -M main
echo ✅ 分支设置完成
echo.

:PushRepo
echo ============================================
echo 准备推送到GitHub
echo ============================================
echo.
echo 请确保：
echo 1. 已在GitHub创建仓库（https://github.com/new）
echo 2. 仓库名：aactp-retrospective
echo 3. 已复制仓库地址
echo.

set /p REPO_URL="输入GitHub仓库地址: "

if "%REPO_URL%"=="" (
    echo ❌ 地址不能为空
    goto PushRepo
)

echo.
echo 连接远程仓库...
git remote add origin %REPO_URL%

if errorlevel 1 (
    echo ⚠️  远程仓库已存在，尝试更新...
    git remote set-url origin %REPO_URL%
)

echo.
echo ============================================
echo 推送到GitHub...
echo ============================================
echo.
echo ⏳ 正在上传，请稍候...
echo 如果提示输入密码，请使用Personal Access Token
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 常见原因：
    echo 1. 网络问题 - 请检查网络连接
    echo 2. 认证失败 - 需要使用Personal Access Token
    echo 3. 仓库不存在 - 请先在GitHub创建仓库
    echo.
    echo 查看详细帮助：GitHub上传指南.md
    pause
    exit /b 1
)

echo.
echo ============================================
echo 🎉 上传成功！
echo ============================================
echo.
echo 下一步：
echo 1. 打开GitHub页面：%REPO_URL%
echo 2. 点击 Actions 标签
echo 3. 等待构建完成（5-10分钟）
echo 4. 下载APK文件
echo.
echo 详细步骤查看：GitHub上传指南.md
echo.
pause
