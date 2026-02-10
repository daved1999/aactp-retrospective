@echo off
chcp 65001 >nul
echo ============================================
echo   AACTP 项目复盘画布 - 启动工具
echo ============================================
echo.
cd /d "%~dp0"

echo 正在检查环境...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Node.js
    echo.
    echo 请先安装Node.js：https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装

REM Kill existing node processes
echo.
echo 正在清理旧进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✅ 环境准备完成
echo.
echo ============================================
echo 请选择启动模式：
echo ============================================
echo.
echo 1. 桌面版（浏览器访问 http://localhost:5000）
echo 2. 停止服务器
echo.

set /p choice="请输入选项 (1/2): "

if "%choice%"=="1" goto StartDesktop
if "%choice%"=="2" goto StopServer
goto InvalidChoice

:StartDesktop
echo.
echo ============================================
echo 正在启动桌面版服务器...
echo ============================================
echo.
echo 启动成功后，请打开浏览器访问：
echo http://localhost:5000
echo.
echo 按 Ctrl+C 可以停止服务器
echo.
timeout /t 3 >nul

node server/server.js

if errorlevel 1 (
    echo.
    echo ❌ 启动失败！
    echo 请检查错误信息 above
)
pause
goto End

:StopServer
echo.
echo ============================================
echo 正在停止服务器...
echo ============================================
taskkill /F /IM node.exe >nul 2>&1
echo ✅ 服务器已停止
pause
goto End

:InvalidChoice
echo ❌ 无效选项，请重新运行脚本
pause

:End
