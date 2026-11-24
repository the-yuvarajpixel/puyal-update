#!/usr/bin/env bash
set -euo pipefail

echo "=== Building PUYAL Command (com.puyal.command) Android APK ==="
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
