@echo off
chcp 65001 >nul
echo 正在生成签名密钥...
cd /d "%~dp0"

:: 使用 keytool 生成密钥
keytool -genkey -v ^
    -keystore app\release-key.jks ^
    -alias aactp-release ^
    -keyalg RSA ^
    -keysize 2048 ^
    -validity 10000 ^
    -storepass aactp2024 ^
    -keypass aactp2024 ^
    -dname "CN=AACTP Project, OU=Development, O=ZQM, L=Beijing, ST=Beijing, C=CN"

if %errorlevel% equ 0 (
    echo ✅ 签名密钥生成成功！
    echo 密钥文件: app\release-key.jks
    echo 别名: aactp-release
    echo.
    echo 现在可以构建 Release 版本了：
    echo .\gradlew assembleRelease
) else (
    echo ❌ 签名密钥生成失败
    echo 请确保已安装 JDK 并配置了环境变量
)

pause