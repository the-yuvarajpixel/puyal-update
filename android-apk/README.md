# PUYAL Command — Android APK Project

- **Package ID:** `com.puyal.command`
- **Version:** `1.0.0` (code `1`)
- **Backend / PWA URL:** `http://localhost:3000`

## Option 1: Build APK with Android Studio (Recommended)
1. Extract this folder and open it in **Android Studio**.
2. Wait for Gradle Sync to finish.
3. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
4. Install `app/build/outputs/apk/debug/app-debug.apk` onto any Android device.

## Option 2: Command-Line Gradle Build
```bash
chmod +x build-apk.sh
./build-apk.sh
```

## Option 3: Trusted Web Activity (TWA) APK via Bubblewrap
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest http://localhost:3000/manifest.webmanifest
bubblewrap build
```
