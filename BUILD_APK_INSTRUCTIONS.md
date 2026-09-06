# 📱 Building APK for Direct Installation

## Quick Method (Recommended)

### Step 1: Install React Native CLI globally (one-time)
```bash
npm install -g @react-native-community/cli
```

### Step 2: Build the APK
```bash
npx react-native build-android --mode release
```

The APK will be created at:
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## Alternative Method: Using Gradle Directly

If you have Android Studio installed:

### Step 1: Open PowerShell in the android folder
```bash
cd android
```

### Step 2: Build using Gradle wrapper
```bash
# If gradlew exists
.\gradlew assembleRelease

# Or if you have Gradle installed globally
gradle assembleRelease
```

### Step 3: Find your APK
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## Manual Build via Android Studio

1. Open Android Studio
2. Open the project folder: `SmartCameraApp/android`
3. Wait for Gradle sync to complete
4. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
5. Wait for build to complete
6. Click "locate" in the notification to find the APK

---

## Installing the APK on Your Phone

### Method 1: USB Transfer
1. Connect your phone to computer via USB
2. Copy `app-release.apk` to your phone's Downloads folder
3. On your phone, open Files app
4. Navigate to Downloads
5. Tap on `app-release.apk`
6. Allow installation from unknown sources if prompted
7. Install the app

### Method 2: Cloud Transfer
1. Upload `app-release.apk` to Google Drive, Dropbox, etc.
2. Download on your phone
3. Install as above

### Method 3: ADB Install (if phone is connected)
```bash
adb install android\app\build\outputs\apk\release\app-release.apk
```

---

## Troubleshooting

### "App not installed" error
- Enable "Install unknown apps" for your file manager
- Settings → Security → Unknown sources → Enable

### Build fails
- Make sure you have Android SDK installed
- Check that ANDROID_HOME environment variable is set
- Run `npm install` to ensure all dependencies are installed

### Signing issues
For a release build, you may need to sign the APK. For testing purposes, you can build a debug APK instead:

```bash
npx react-native build-android --mode debug
```

Debug APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## Quick Build Command

Run this in PowerShell from the SmartCameraApp folder:

```powershell
# Build release APK
npx react-native build-android --mode release

# Or build debug APK (easier, no signing needed)
npx react-native build-android --mode debug
```

Then find your APK at:
- **Release:** `android\app\build\outputs\apk\release\app-release.apk`
- **Debug:** `android\app\build\outputs\apk\debug\app-debug.apk`

Transfer to your phone and install!
