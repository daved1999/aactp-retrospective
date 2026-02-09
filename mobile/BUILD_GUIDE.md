# AACTP项目复盘画布 - Android APK构建指南

## 📱 项目概述
这是一个完整的Android应用程序，使用WebView加载本地HTML文件，无需后端服务器，所有数据存储在设备本地（localStorage）。

## 📂 文件结构

```
mobile/
├── index.html              # 主页面
├── styles.css             # 样式文件
├── app.js                 # 离线版JavaScript（使用localStorage）
├── package.json           # Capacitor配置（可选）
├── capacitor.config.json  # Capacitor配置（可选）
└── android/               # Android项目
    ├── build.gradle
    ├── settings.gradle
    ├── gradlew.bat
    ├── gradle/
    │   └── wrapper/
    │       └── gradle-wrapper.properties
    └── app/
        ├── build.gradle
        ├── proguard-rules.pro
        └── src/
            └── main/
                ├── AndroidManifest.xml
                ├── java/com/aactp/retrospective/
                │   └── MainActivity.kt
                ├── res/
                │   ├── layout/
                │   │   └── activity_main.xml
                │   ├── values/
                │   │   ├── colors.xml
                │   │   ├── strings.xml
                │   │   └── styles.xml
                │   └── mipmap-hdpi/
                └── assets/
                    └── www/
                        ├── index.html
                        ├── styles.css
                        └── app.js
```

## 🔧 构建方法

### 方法一：使用Android Studio（推荐）

#### 1. 准备工作
- 安装 [Android Studio](https://developer.android.com/studio)
- 安装 Android SDK（API 24+）
- 配置 JAVA_HOME 环境变量

#### 2. 复制文件到Android项目
```bash
cd mobile/android/app/src/main/assets
mkdir -p www
cp ../../../../../index.html www/
cp ../../../../../styles.css www/
cp ../../../../../app.js www/
```

#### 3. 使用Android Studio打开项目
1. 打开Android Studio
2. 选择 "Open an existing Android Studio project"
3. 选择 `mobile/android` 目录
4. 等待Gradle同步完成

#### 4. 构建APK
1. 菜单栏选择 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
2. 等待构建完成
3. APK文件位置：`app/build/outputs/apk/debug/app-debug.apk`

#### 5. 生成签名APK（发布用）
1. 菜单栏选择 `Build` > `Generate Signed Bundle / APK`
2. 选择 `APK`
3. 创建或选择密钥库（keystore）
4. 选择发布版本
5. APK文件位置：`app/build/outputs/apk/release/app-release.apk`

### 方法二：使用命令行

#### 1. 配置环境变量
```bash
# Windows
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

#### 2. 复制资源文件
```bash
cd mobile
xcopy /E /I index.html android\app\src\main\assets\www\
xcopy /E /I styles.css android\app\src\main\assets\www\
xcopy /E /I app.js android\app\src\main\assets\www\
```

#### 3. 构建APK
```bash
cd android
gradlew.bat assembleDebug
```

#### 4. 查找APK
APK文件位置：`app/build/outputs/apk/debug/app-debug.apk`

### 方法三：使用Capacitor（高级用户）

如果你有Node.js环境，可以使用Capacitor构建：

#### 1. 安装依赖
```bash
cd mobile
npm install
```

#### 2. 添加Android平台
```bash
npx cap add android
```

#### 3. 同步文件
```bash
npx cap sync
```

#### 4. 打开Android Studio
```bash
npx cap open android
```

然后按照方法一从第4步开始构建。

## 📋 系统要求

### 开发环境
- **操作系统**: Windows 10/11, macOS, 或 Linux
- **Java**: JDK 11 或更高版本
- **Android Studio**: 最新稳定版
- **Android SDK**: API 24 (Android 7.0) 或更高

### 目标设备
- **最低Android版本**: Android 7.0 (API 24)
- **目标Android版本**: Android 14 (API 34)
- **存储空间**: 约20MB
- **权限**: 
  - 存储权限（用于数据导出/导入，Android 10及以下）
  - 网络权限（预留，实际不需要网络连接）

## ✨ 功能特性

### 离线使用
- ✅ 无需网络连接
- ✅ 无需后端服务器
- ✅ 所有数据存储在设备本地
- ✅ 支持数据导出/导入备份

### 移动端优化
- ✅ 响应式布局适配手机/平板
- ✅ 触摸友好的按钮和表单
- ✅ 支持横屏/竖屏切换
- ✅ 物理返回键支持
- ✅ 深色模式支持

### 数据管理
- ✅ 创建多个复盘项目
- ✅ 完整的CRUD操作（增删改查）
- ✅ JSON格式数据导出
- ✅ 从JSON文件导入数据
- ✅ 本地存储自动保存

## 🔐 应用信息

- **应用ID**: `com.aactp.retrospective`
- **应用名称**: AACTP项目复盘
- **版本**: 1.0.0
- **签名**: 需要自行创建密钥库

## 📱 安装方法

### 直接在设备安装（开发者模式）
1. 开启设备的"开发者选项"
2. 开启"USB调试"
3. 连接电脑，使用ADB安装：
```bash
adb install app-debug.apk
```

### 手动安装APK
1. 将APK文件传输到设备
2. 在文件管理器中点击APK文件
3. 允许安装来自未知来源的应用
4. 完成安装

## 🐛 故障排除

### 构建失败
**问题**: Gradle sync失败
**解决**: 
- 检查网络连接
- 更新Gradle版本
- 清理项目：`Build` > `Clean Project`

### Java版本不匹配
**问题**: 编译器版本错误
**解决**:
- 确保使用JDK 11或更高版本
- 在Android Studio中设置：`File` > `Project Structure` > `SDK Location`

### 应用无法安装
**问题**: 解析包时出错
**解决**:
- 确保APK完整下载
- 检查设备Android版本 >= 7.0
- 允许安装未知来源应用

### 数据丢失
**问题**: 应用数据被清除
**解决**:
- 定期使用导出功能备份数据
- 备份文件：`/Download/aactp-backup-YYYY-MM-DD.json`

## 🚀 发布到应用商店

### 准备工作
1. 生成签名密钥库
2. 构建发布版APK
3. 准备应用截图和描述
4. 创建隐私政策

### Google Play Store
1. 注册开发者账号（$25 USD）
2. 登录 [Google Play Console](https://play.google.com/console)
3. 创建新应用
4. 上传签名APK/AAB
5. 填写商店信息
6. 提交审核

### 国内应用商店
- 华为应用市场
- 小米应用商店
- OPPO/Vivo应用商店
- 腾讯应用宝

## 📞 技术支持

如有问题，请检查：
1. README.md 文件
2. 代码注释
3. Android Studio日志

## 📝 更新日志

### v1.0.0 (2024-01)
- 初始版本发布
- 完整的四大模块功能
- 离线数据存储
- Android 7.0+ 支持
