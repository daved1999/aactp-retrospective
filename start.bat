@echo off
chcp 65001 >nul
echo 正在启动 AACTP 项目复盘画布服务器...
echo.
cd /d "%~dp0"
echo 安装依赖（首次运行需要）...
call npm install --silent
echo.
echo 启动服务器...
echo 访问地址: http://localhost:5000
echo.
node server/server.js
pause
