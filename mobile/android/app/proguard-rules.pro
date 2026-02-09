# ProGuard rules for AACTP Retrospective App
# These rules prevent ProGuard from removing essential code

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView
-keepclassmembers class * extends android.webkit.WebView {
    public <init>(android.content.Context);
}

# Keep the MainActivity
-keep public class com.aactp.retrospective.MainActivity {
    public <init>(android.content.Context);
}
