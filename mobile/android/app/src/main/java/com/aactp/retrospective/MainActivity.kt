package com.aactp.retrospective

import android.Manifest
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private var backPressedTime: Long = 0
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var downloadReceiver: BroadcastReceiver? = null
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
        private const val DOWNLOAD_DIRECTORY = "复盘画布"
    }
    
    // File picker launcher for single/multiple files
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            filePathCallback?.onReceiveValue(arrayOf(uri))
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }
    
    // Multiple files picker launcher
    private val multipleFilePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri>? ->
        if (uris != null && uris.isNotEmpty()) {
            filePathCallback?.onReceiveValue(uris.toTypedArray())
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webView)
        setupWebView()
        checkPermissions()
        setupDownloadReceiver()
        
        // Enable full screen on Android 11+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        }
        
        // Handle configuration changes (orientation)
        handleOrientationChange(resources.configuration.orientation)
    }
    
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        handleOrientationChange(newConfig.orientation)
    }
    
    private fun handleOrientationChange(orientation: Int) {
        // WebView will automatically handle the orientation change
        // Just ensure the layout is updated
        webView.requestLayout()
    }
    
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            mediaPlaybackRequiresUserGesture = false
            
            // Android 10+ (API 29+) 这些设置需要特殊处理
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+ 使用新的 API
                allowFileAccess = false
                allowContentAccess = true
            } else {
                allowFileAccess = true
                allowContentAccess = true
            }
        }
        
        // Add JavaScript Interface for file operations
        webView.addJavascriptInterface(WebAppInterface(this), "Android")
        
        webView.webViewClient = WebViewClient()
        
        // Custom WebChromeClient to handle file input
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback = filePathCallback
                
                // Get accepted mime types
                val acceptTypes = fileChooserParams?.acceptTypes
                val isImage = acceptTypes?.any { it.startsWith("image/") } ?: false
                
                if (isImage) {
                    // Launch multiple image picker
                    multipleFilePickerLauncher.launch("image/*")
                } else {
                    // Launch single file picker for JSON
                    filePickerLauncher.launch("application/json")
                }
                return true
            }
        }
        
        // Set download listener - disabled for Android 10+
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
                // This won't be triggered for blob URLs, we handle that via JavaScript interface
            }
        }
        
        // Load local HTML file
        webView.loadUrl("file:///android_asset/www/index.html")
    }
    
    private fun setupDownloadReceiver() {
        downloadReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == DownloadManager.ACTION_DOWNLOAD_COMPLETE) {
                    val downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (downloadId != -1L) {
                        Toast.makeText(this@MainActivity, "文件已保存到 Download/$DOWNLOAD_DIRECTORY 文件夹", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
        
        registerReceiver(downloadReceiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
    }
    
    private fun checkPermissions() {
        // Android 14+ (API 34+) 需要特殊处理
        val permissions = when {
            // Android 14+ - 根据需要申请权限
            Build.VERSION.SDK_INT >= 34 -> {
                // Android 14+ 对于 WebView 本地存储不需要特殊权限
                // 导出功能使用 MediaStore，导入功能使用文件选择器
                emptyArray()
            }
            // Android 13 (API 33) - 使用新的媒体权限
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                arrayOf(
                    Manifest.permission.READ_MEDIA_IMAGES
                )
            }
            // Android 10-12 (API 29-32) - 使用传统存储权限
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q -> {
                arrayOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE
                )
            }
            // Android 9 及以下 - 使用读写权限
            else -> {
                arrayOf(
                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
                    Manifest.permission.READ_EXTERNAL_STORAGE
                )
            }
        }
        
        if (permissions.isNotEmpty()) {
            val needPermissions = permissions.filter {
                ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
            }
            
            if (needPermissions.isNotEmpty()) {
                ActivityCompat.requestPermissions(this, needPermissions.toTypedArray(), PERMISSION_REQUEST_CODE)
            }
        }
    }
    
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "权限已授予", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // Double tap to exit
            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                super.onBackPressed()
                return
            } else {
                Toast.makeText(this, "再按一次退出应用", Toast.LENGTH_SHORT).show()
            }
            backPressedTime = System.currentTimeMillis()
        }
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
    
    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
    
    override fun onDestroy() {
        downloadReceiver?.let { unregisterReceiver(it) }
        webView.destroy()
        super.onDestroy()
    }
    
    // JavaScript Interface for file operations
    inner class WebAppInterface(private val context: Context) {
        
        @JavascriptInterface
        fun exportFile(filename: String, content: String): String {
            return try {
                // Generate unique filename with milliseconds timestamp
                val timestamp = SimpleDateFormat("HHmmss_SSS", Locale.getDefault()).format(Date())
                val nameWithoutExt = filename.substringBeforeLast(".")
                val ext = filename.substringAfterLast(".", "")
                val uniqueFilename = if (ext.isNotEmpty()) "${nameWithoutExt}_${timestamp}.${ext}" else "${nameWithoutExt}_${timestamp}"
                
                lateinit var filePath: String
                
                when {
                    // Android 14+ (API 34+) - 使用 MediaStore 并处理新限制
                    Build.VERSION.SDK_INT >= 34 -> {
                        val contentValues = ContentValues().apply {
                            put(MediaStore.Downloads.DISPLAY_NAME, uniqueFilename)
                            put(MediaStore.Downloads.MIME_TYPE, "application/json")
                            put(MediaStore.Downloads.RELATIVE_PATH, "Download/$DOWNLOAD_DIRECTORY")
                            // Android 14+ 需要设置 IS_PENDING
                            put(MediaStore.Downloads.IS_PENDING, 1)
                        }
                        
                        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                        if (uri != null) {
                            context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                                outputStream.write(content.toByteArray(Charsets.UTF_8))
                            }
                            // 清除 IS_PENDING 标记
                            contentValues.clear()
                            contentValues.put(MediaStore.Downloads.IS_PENDING, 0)
                            context.contentResolver.update(uri, contentValues, null, null)
                            filePath = uri.toString()
                        } else {
                            throw Exception("无法创建文件")
                        }
                    }
                    // Android 10+ (API 29+) - 使用 MediaStore
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q -> {
                        val contentValues = ContentValues().apply {
                            put(MediaStore.Downloads.DISPLAY_NAME, uniqueFilename)
                            put(MediaStore.Downloads.MIME_TYPE, "application/json")
                            put(MediaStore.Downloads.RELATIVE_PATH, "Download/$DOWNLOAD_DIRECTORY")
                        }
                        
                        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                        if (uri != null) {
                            context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                                outputStream.write(content.toByteArray(Charsets.UTF_8))
                            }
                            filePath = uri.toString()
                        } else {
                            throw Exception("无法创建文件")
                        }
                    }
                    // Android 9 及以下 - 使用传统方式
                    else -> {
                        val downloadDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), DOWNLOAD_DIRECTORY)
                        if (!downloadDir.exists()) {
                            downloadDir.mkdirs()
                        }
                        
                        val file = File(downloadDir, uniqueFilename)
                        FileOutputStream(file).use { outputStream ->
                            outputStream.write(content.toByteArray(Charsets.UTF_8))
                        }
                        filePath = file.absolutePath
                    }
                }
                
                // Show success message on UI thread
                runOnUiThread {
                    Toast.makeText(context, "文件已保存到: Download/$DOWNLOAD_DIRECTORY/$uniqueFilename", Toast.LENGTH_LONG).show()
                }
                
                filePath
            } catch (e: Exception) {
                e.printStackTrace()
                runOnUiThread {
                    Toast.makeText(context, "保存失败: ${e.message}", Toast.LENGTH_LONG).show()
                }
                "error: ${e.message}"
            }
        }
        
        @JavascriptInterface
        fun getDownloadPath(): String {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                "Download/$DOWNLOAD_DIRECTORY"
            } else {
                val downloadDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), DOWNLOAD_DIRECTORY)
                downloadDir.absolutePath
            }
        }
        
        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(context, message, Toast.LENGTH_LONG).show()
            }
        }
    }
}
