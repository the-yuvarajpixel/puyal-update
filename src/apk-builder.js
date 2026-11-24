// ============================================================================
// PUYAL — Android APK Project Generator (Gradle WebView + Bubblewrap TWA + Capacitor)
// Includes a zero-dependency RFC 1951 ZIP archive builder for instant download.
// ============================================================================
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Precompute CRC32 table for valid ZIP archives
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Creates a standards-compliant ZIP buffer from an array of { path, content }.
 * content may be a UTF-8 string or a Buffer.
 */
export function createZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

  for (const entry of entries) {
    const cleanName = String(entry.path || 'file.txt').replace(/^\/+/, '');
    const nameBuf = Buffer.from(cleanName, 'utf8');
    const rawBuf = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(String(entry.content ?? ''), 'utf8');
    const compressed = zlib.deflateRawSync(rawBuf, { level: 6 });
    const checksum = crc32(rawBuf);

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);         // version needed
    localHeader.writeUInt16LE(0x0800, 6);     // UTF-8 flag
    localHeader.writeUInt16LE(8, 8);          // deflate method
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    const isExecutable = cleanName.endsWith('.sh');
    centralHeader.writeUInt32LE(isExecutable ? 0x81ed0000 : 0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

function sanitizePackageId(rawId) {
  const cleaned = String(rawId || 'com.puyal.command')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  const parts = cleaned.split('.').filter(Boolean);
  if (parts.length < 2) return 'com.puyal.command';
  return parts.map(p => (/^[a-z]/.test(p) ? p : `a${p}`)).join('.');
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeApkConfig(input = {}, fallbackHost = 'https://localhost:3000') {
  const packageId = sanitizePackageId(input.packageId || 'com.puyal.command');
  const appName = String(input.appName || 'PUYAL Command').trim().slice(0, 48) || 'PUYAL Command';
  const versionName = String(input.versionName || '1.0.0').replace(/[^0-9A-Za-z._-]/g, '') || '1.0.0';
  const versionCode = Math.max(1, parseInt(input.versionCode || '1', 10) || 1);
  const rawUrl = String(input.serverUrl || fallbackHost || 'https://localhost:3000').trim();
  const serverUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl.replace(/\/+$/, '') : `https://${rawUrl.replace(/\/+$/, '')}`;
  const defaultPermissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.RECORD_AUDIO',
    'android.permission.CAMERA',
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_SCAN'
  ];
  const permissions = Array.isArray(input.permissions) && input.permissions.length > 0
    ? Array.from(new Set(['android.permission.INTERNET', ...input.permissions.filter(p => /^android\.permission\.[A-Z0-9_]+$/.test(p))]))
    : defaultPermissions;

  return {
    packageId,
    appName,
    versionName,
    versionCode,
    serverUrl,
    permissions,
    themeColor: '#0f172a',
    backgroundColor: '#0f172a'
  };
}

export function buildAndroidApkProjectFiles(rawConfig = {}, puyalDir = '') {
  const cfg = normalizeApkConfig(rawConfig);
  const pkgPath = cfg.packageId.replace(/\./g, '/');
  let parsedHost = 'localhost';
  try {
    parsedHost = new URL(cfg.serverUrl).host;
  } catch (e) {}

  const permXml = cfg.permissions
    .map(p => `    <uses-permission android:name="${p}" />`)
    .join('\n');

  const files = [];

  files.push({
    path: 'settings.gradle',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${cfg.appName.replace(/"/g, '')}"
include ':app'
`
  });

  files.push({
    path: 'gradle.properties',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=false
android.nonTransitiveRClass=true
`
  });

  files.push({
    path: 'build.gradle',
    content: `plugins {
    id 'com.android.application' version '8.6.1' apply false
}
`
  });

  files.push({
    path: 'app/build.gradle',
    content: `plugins {
    id 'com.android.application'
}

android {
    namespace '${cfg.packageId}'
    compileSdk 35

    defaultConfig {
        applicationId "${cfg.packageId}"
        minSdk 24
        targetSdk 35
        versionCode ${cfg.versionCode}
        versionName "${cfg.versionName}"
        buildConfigField "String", "PUYAL_BASE_URL", "\\"${cfg.serverUrl}\\""
    }

    buildFeatures {
        buildConfig true
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.webkit:webkit:1.12.1'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
`
  });

  files.push({
    path: 'app/proguard-rules.pro',
    content: `-keep class ${cfg.packageId}.MainActivity$PuyalAndroidBridge { *; }
-keepattributes JavascriptInterface
`
  });

  files.push({
    path: 'app/src/main/AndroidManifest.xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
${permXml}

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.microphone" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:allowBackup="true"
        android:label="${escapeXml(cfg.appName)}"
        android:icon="@drawable/ic_launcher_puyal"
        android:roundIcon="@drawable/ic_launcher_puyal"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.PuyalCommand">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${escapeXml(parsedHost)}" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  });

  files.push({
    path: 'app/src/main/res/values/styles.xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.PuyalCommand" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:statusBarColor">#0F172A</item>
        <item name="android:navigationBarColor">#0F172A</item>
        <item name="android:windowBackground">#0F172A</item>
    </style>
</resources>
`
  });

  files.push({
    path: `app/src/main/java/${pkgPath}/MainActivity.java`,
    content: `package ${cfg.packageId};

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
`
  });

  files.push({
    path: 'twa-manifest.json',
    content: JSON.stringify({
      packageId: cfg.packageId,
      host: parsedHost,
      name: cfg.appName,
      launcherName: cfg.appName.slice(0, 12),
      display: 'standalone',
      themeColor: cfg.themeColor,
      navigationColor: cfg.backgroundColor,
      backgroundColor: cfg.backgroundColor,
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${cfg.serverUrl}/pwa-512x512.png`,
      maskableIconUrl: `${cfg.serverUrl}/pwa-maskable-512x512.png`,
      webManifestUrl: `${cfg.serverUrl}/manifest.webmanifest`,
      appVersionName: cfg.versionName,
      appVersionCode: cfg.versionCode,
      shortcuts: [
        { name: 'SOS Live Stream', shortName: 'SOS', url: '/dashboard-user.html?action=sos' },
        { name: 'Voice AI Studio', shortName: 'Voice AI', url: '/voice-studio.html' }
      ],
      features: {
        locationDelegation: { enabled: true }
      }
    }, null, 2) + '\n'
  });

  files.push({
    path: 'capacitor.config.json',
    content: JSON.stringify({
      appId: cfg.packageId,
      appName: cfg.appName,
      webDir: 'puyal',
      server: {
        url: cfg.serverUrl,
        cleartext: cfg.serverUrl.startsWith('http://')
      },
      android: {
        allowMixedContent: true,
        backgroundColor: cfg.backgroundColor
      }
    }, null, 2) + '\n'
  });

  files.push({
    path: 'build-apk.sh',
    content: `#!/usr/bin/env bash
set -euo pipefail

echo "=== Building ${cfg.appName} (${cfg.packageId}) Android APK ==="
if [ -x "./gradlew" ]; then
  ./gradlew assembleDebug
  echo "APK output: app/build/outputs/apk/debug/app-debug.apk"
elif command -v gradle >/dev/null 2>&1; then
  gradle assembleDebug
  echo "APK output: app/build/outputs/apk/debug/app-debug.apk"
elif command -v npx >/dev/null 2>&1; then
  echo "Running Bubblewrap TWA APK build..."
  npx --yes @bubblewrap/cli build
else
  echo "Open this folder in Android Studio and select Build > Build Bundle(s) / APK(s) > Build APK(s)."
  exit 1
fi
`
  });

  files.push({
    path: 'README.md',
    content: `# ${cfg.appName} — Android APK Project

- **Package ID:** \`${cfg.packageId}\`
- **Version:** \`${cfg.versionName}\` (code \`${cfg.versionCode}\`)
- **Backend / PWA URL:** \`${cfg.serverUrl}\`

## Option 1: Build APK with Android Studio (Recommended)
1. Extract this folder and open it in **Android Studio**.
2. Wait for Gradle Sync to finish.
3. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
4. Install \`app/build/outputs/apk/debug/app-debug.apk\` onto any Android device.

## Option 2: Command-Line Gradle Build
\`\`\`bash
chmod +x build-apk.sh
./build-apk.sh
\`\`\`

## Option 3: Trusted Web Activity (TWA) APK via Bubblewrap
\`\`\`bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest ${cfg.serverUrl}/manifest.webmanifest
bubblewrap build
\`\`\`
`
  });

  // Bundle PNG icon assets from /puyal if available
  if (puyalDir) {
    const icon512 = path.join(puyalDir, 'pwa-512x512.png');
    if (fs.existsSync(icon512)) {
      files.push({
        path: 'app/src/main/res/drawable/ic_launcher_puyal.png',
        content: fs.readFileSync(icon512)
      });
    }
  }

  return { config: cfg, files };
}

/**
 * Materializes the default Android APK project into /android-apk on disk so it
 * is immediately inspectable and buildable from the workspace.
 */
export function ensureAndroidApkWorkspaceDir(targetDir, rawConfig, puyalDir) {
  const { config, files } = buildAndroidApkProjectFiles(rawConfig, puyalDir);
  for (const f of files) {
    const fullPath = path.join(targetDir, f.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    if (Buffer.isBuffer(f.content)) {
      fs.writeFileSync(fullPath, f.content);
    } else {
      fs.writeFileSync(fullPath, f.content, 'utf8');
    }
  }
  return { config, filePaths: files.map(f => f.path) };
}
