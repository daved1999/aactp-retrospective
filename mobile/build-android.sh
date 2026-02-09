#!/bin/bash
# AACTP Android Build Script for Linux/Mac
# This script prepares the Android project for building

echo "=========================================="
echo "  AACTP项目复盘 - Android构建脚本"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in the right directory
if [ ! -f "build-android.sh" ]; then
    echo -e "${RED}错误: 请在mobile目录中运行此脚本${NC}"
    exit 1
fi

echo "[1/5] 检查目录结构..."
if [ ! -d "android" ]; then
    echo -e "${RED}错误: 找不到android目录${NC}"
    exit 1
fi

echo "[2/5] 创建资源目录..."
mkdir -p android/app/src/main/assets/www
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 目录已创建${NC}"
else
    echo -e "${RED}✗ 创建目录失败${NC}"
    exit 1
fi

echo "[3/5] 复制前端文件到Android项目..."
cp index.html android/app/src/main/assets/www/
cp styles.css android/app/src/main/assets/www/
cp app.js android/app/src/main/assets/www/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 文件复制完成${NC}"
else
    echo -e "${RED}✗ 文件复制失败${NC}"
    exit 1
fi

echo "[4/5] 验证文件..."
if [ -f "android/app/src/main/assets/www/index.html" ] && \
   [ -f "android/app/src/main/assets/www/styles.css" ] && \
   [ -f "android/app/src/main/assets/www/app.js" ]; then
    echo -e "${GREEN}✓ 所有文件已就位${NC}"
    ls -lh android/app/src/main/assets/www/
else
    echo -e "${RED}✗ 文件验证失败${NC}"
    exit 1
fi

echo "[5/5] 检查构建环境..."
if command -v java &> /dev/null; then
    echo -e "${GREEN}✓ Java已安装: $(java -version 2>&1 | head -n 1)${NC}"
else
    echo -e "${YELLOW}⚠ Java未安装，请安装JDK 17或更高版本${NC}"
    echo "  下载地址: https://adoptium.net/"
fi

if [ -f "android/gradlew" ]; then
    echo -e "${GREEN}✓ Gradle wrapper已就绪${NC}"
else
    echo -e "${YELLOW}⚠ Gradle wrapper未找到${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}项目准备完成！${NC}"
echo ""
echo "下一步:"
echo "1. 确保已安装Android Studio或Gradle"
echo "2. 运行以下命令构建APK:"
echo ""
echo "   cd android"
echo "   ./gradlew assembleDebug"
echo ""
echo "或在Windows上:"
echo "   cd android"
echo "   gradlew.bat assembleDebug"
echo ""
echo "APK将生成在:"
echo "   app/build/outputs/apk/debug/app-debug.apk"
echo "=========================================="
