#!/bin/bash
# 生成签名密钥脚本

echo "正在生成签名密钥..."
cd "$(dirname "$0")"

# 使用 keytool 生成密钥
keytool -genkey -v \
    -keystore app/release-key.jks \
    -alias aactp-release \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass aactp2024 \
    -keypass aactp2024 \
    -dname "CN=AACTP Project, OU=Development, O=ZQM, L=Beijing, ST=Beijing, C=CN"

if [ $? -eq 0 ]; then
    echo "✅ 签名密钥生成成功！"
    echo "密钥文件: app/release-key.jks"
    echo "别名: aactp-release"
else
    echo "❌ 签名密钥生成失败"
    exit 1
fi