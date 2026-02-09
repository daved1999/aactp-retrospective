# AACTP项目复盘画布 - Android APK版

## 📱 概述
这是一个完全离线的Android应用程序，基于AACTP项目复盘画布方法论，无需网络连接，无需后端服务器。

## ✨ 特点
- ✅ **完全离线** - 无需网络，无需服务器
- ✅ **本地存储** - 数据保存在设备上（localStorage）
- ✅ **完整功能** - 包含四大模块的所有功能
- ✅ **移动端优化** - 专为手机和平板设计的UI
- ✅ **数据备份** - 支持导出/导入JSON文件

## 🚀 快速开始

### Windows用户
1. 确保已安装 [Android Studio](https://developer.android.com/studio)
2. 双击运行 `build-apk.bat`
3. 等待Android Studio打开
4. 在Android Studio中点击：`Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
5. 生成的APK位置：`app/build/outputs/apk/debug/app-debug.apk`

### 手动构建
详见 [BUILD_GUIDE.md](BUILD_GUIDE.md)

## 📂 文件说明

```
mobile/
├── index.html         # 主页面（Web版）
├── styles.css         # 样式文件
├── app.js            # 离线版JavaScript
├── package.json      # Node配置（可选）
├── build-apk.bat     # Windows构建脚本
├── BUILD_GUIDE.md    # 详细构建指南
└── android/          # Android项目文件
    ├── build.gradle
    ├── settings.gradle
    ├── gradlew.bat
    └── app/
        ├── build.gradle
        ├── src/main/
        │   ├── AndroidManifest.xml
        │   ├── java/com/aactp/retrospective/MainActivity.kt
        │   ├── res/layout/activity_main.xml
        │   └── assets/www/     # 前端文件将复制到这里
        └── ...
```

## 🏗️ 技术架构

### 前端
- HTML5 + CSS3 + JavaScript（ES6+）
- Chart.js 图表库
- 纯localStorage数据持久化

### Android
- Kotlin + Android SDK
- WebView组件加载本地HTML
- Material Design 3 主题
- 支持Android 7.0+ (API 24)

## 📱 功能模块

### 1. 驾驶舱
- 全局数据统计
- 数据分布饼图
- 最近复盘列表
- 快速入口

### 2. 回顾目标
- 总目标设定
- 多个阶段目标
- 完成情况追踪

### 3. 评估策略
- 策略列表管理
- 目标与结果记录

### 4. 反思过程
- 四个分类：亮点、不足、变化项、标杆案例
- 详细记录：事项、做法、影响、启发

### 5. 总结规律
- 领悟/规律/行为
- 行动计划（停止/继续/开始）

## 💾 数据管理

### 导出数据
在侧边栏点击"导出数据"，将生成JSON文件保存到设备。

### 导入数据
在侧边栏点击"导入数据"，选择之前导出的JSON文件。

### 数据存储位置
- **Web版**: 浏览器localStorage
- **Android版**: WebView的localStorage

## ⚠️ 注意事项

1. **首次构建**：需要下载Gradle和依赖库，可能需要几分钟
2. **Android Studio版本**：建议使用最新稳定版
3. **Java版本**：需要JDK 11或更高
4. **设备兼容性**：支持Android 7.0及以上版本

## 🐛 常见问题

### Q: 找不到Android Studio？
A: 请确保已安装Android Studio，或手动打开项目目录 `mobile/android`

### Q: 构建失败？
A: 检查网络连接，首次构建需要下载依赖。清理项目后重试：`Build` > `Clean Project`

### Q: 如何生成签名APK？
A: 在Android Studio中选择 `Build` > `Generate Signed Bundle / APK`，创建密钥库后构建

## 📄 相关文档

- [详细构建指南](BUILD_GUIDE.md) - 完整的构建步骤和故障排除
- [使用说明书](../README.md) - 应用功能说明（在项目根目录）

## 🎯 下一步

构建完成后，你可以：
1. 在Android模拟器或真实设备上测试
2. 生成签名APK用于发布
3. 上传到各大应用商店

## 📞 技术支持

如有问题，请查看：
1. BUILD_GUIDE.md 详细文档
2. 代码中的注释
3. Android Studio的构建日志

---

**版本**: 1.0.0  
**更新日期**: 2024年
