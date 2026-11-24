package com.puyal.command;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.List;

/**
 * PUYAL Command Native Android APK Shell
 * Bridges offline Service Worker caching, SOS camera/mic live streaming,
 * geolocation tracking, Voice AI Studio, and native hardware vibration.
 */
public class MainActivity extends AppCompatActivity {
    private static final int PERM_REQUEST_CODE = 4401;
    private WebView webView;
    private PermissionRequest pendingWebPermissionRequest;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);

        webView.addJavascriptInterface(new PuyalAndroidBridge(this), "PuyalAndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                pendingWebPermissionRequest = request;
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        requestEmergencyPermissions();
        webView.loadUrl(BuildConfig.PUYAL_BASE_URL);
    }

    private void requestEmergencyPermissions() {
        String[] wanted = new String[] {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA
        };
        List<String> missing = new ArrayList<>();
        for (String perm : wanted) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                missing.add(perm);
            }
        }
        if (!missing.isEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toArray(new String[0]), PERM_REQUEST_CODE);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERM_REQUEST_CODE && pendingWebPermissionRequest != null) {
            pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
            pendingWebPermissionRequest = null;
        }
    }

    public static class PuyalAndroidBridge {
        private final Context context;

        public PuyalAndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String getPlatformInfo() {
            return "PUYAL-Android-APK/" + BuildConfig.VERSION_NAME + " (SDK " + Build.VERSION.SDK_INT + ")";
        }

        @JavascriptInterface
        public void triggerSosHaptic() {
            Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            long[] pattern = new long[] { 0, 180, 70, 180, 70, 320 };
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createWaveform(pattern, -1));
            } else {
                v.vibrate(pattern, -1);
            }
        }
    }
}
