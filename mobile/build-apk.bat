@echo off
chcp 65001 >nul
echo ============================================
echo   AACTP项目复盘 - Android APK构建工具
echo ============================================
echo.

set PROJECT_DIR=%~dp0
set ANDROID_DIR=%PROJECT_DIR%android
set ASSETS_DIR=%ANDROID_DIR%\app\src\main\assets\www

echo [1/5] 检查目录结构...
if not exist "%ANDROID_DIR%" (
    echo 错误：找不到android目录
    pause
    exit /b 1
)

echo [2/5] 创建资源目录...
if not exist "%ASSETS_DIR%" (
    mkdir "%ASSETS_DIR%"
    echo 已创建: %ASSETS_DIR%
) else (
    echo 目录已存在
)

echo [3/5] 复制前端文件到Android项目...
copy /Y "%PROJECT_DIR%index.html" "%ASSETS_DIR%\" >nul
copy /Y "%PROJECT_DIR%styles.css" "%ASSETS_DIR%\" >nul
copy /Y "%PROJECT_DIR%app.js" "%ASSETS_DIR%\" >nul
echo 文件复制完成！

echo [4/5] 检查Android Studio...
set STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe
if not exist "%STUDIO_PATH%" (
    set STUDIO_PATH=%LOCALAPPDATA%\Android\android-studio\bin\studio64.exe
)

echo [5/5] 打开Android Studio...
if exist "%STUDIO_PATH%" (
    echo 正在启动Android Studio...
    start "" "%STUDIO_PATH%" "%ANDROID_DIR%"
    echo.
    echo ============================================
    echo 构建步骤：
    echo 1. 等待Android Studio加载完成
    echo 2. 点击菜单：Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
    echo 3. 等待构建完成
    echo 4. APK位置：app/build/outputs/apk/debug/app-debug.apk
    echo ============================================
) else (
    echo 警告：找不到Android Studio
    echo 请手动打开Android Studio并选择项目目录：
    echo %ANDROID_DIR%
    echo.
    echo 或者使用命令行构建（需要配置Gradle）：
    echo cd "%ANDROID_DIR%"
    echo gradlew.bat assembleDebug
)

echo.
pause
