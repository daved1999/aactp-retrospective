#!/bin/bash
# Quick build script for AACTP Android APK
# Usage: ./quick-build.sh

echo "AACTP Android Quick Build"
echo "=========================="

# Setup
cd "$(dirname "$0")"
mkdir -p android/app/src/main/assets/www

# Copy files
cp index.html android/app/src/main/assets/www/
cp styles.css android/app/src/main/assets/www/
cp app.js android/app/src/main/assets/www/

echo "✅ Files copied"

# Check Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo "✅ Java: $JAVA_VERSION"
    
    # Build
    cd android
    if [ -f "gradlew" ]; then
        echo "🔨 Building APK..."
        ./gradlew assembleDebug
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Build successful!"
            echo "📱 APK location:"
            find app/build/outputs/apk -name "*.apk" -type f
        else
            echo "❌ Build failed"
            exit 1
        fi
    else
        echo "❌ Gradle wrapper not found"
        exit 1
    fi
else
    echo "❌ Java not found. Please install JDK 17+"
    exit 1
fi
