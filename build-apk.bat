@echo off
echo Building APK for SmartCameraApp...
echo.

cd android

echo Step 1: Cleaning previous builds...
if exist app\build\outputs\apk\release (
    rmdir /s /q app\build\outputs\apk\release
)

echo Step 2: Building release APK...
call npx react-native build-android --mode=release

echo.
echo ============================================================
echo Build complete!
echo APK location: android\app\build\outputs\apk\release\
echo ============================================================
echo.

cd ..
