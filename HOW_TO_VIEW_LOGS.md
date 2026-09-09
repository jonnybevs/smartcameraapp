# How to View React Native Logs on Android

There are several ways to view logs from your React Native app:

## Method 1: Using ADB Logcat (Recommended for Detailed Logs)

### Prerequisites:
- Android Debug Bridge (ADB) installed (comes with Android Studio)
- Phone connected via USB with USB debugging enabled

### Steps:

1. **Enable USB Debugging on your phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect your phone to PC via USB**

3. **Open PowerShell/Command Prompt and run:**
   ```powershell
   adb logcat | Select-String "CameraScreen|Preprocess|TFLite|ImageProcessor"
   ```

   Or to see ALL logs:
   ```powershell
   adb logcat
   ```

4. **Open the app and take a photo** - you'll see the logs in real-time

5. **To save logs to a file:**
   ```powershell
   adb logcat > C:\Users\jonny\app_logs.txt
   ```

## Method 2: React Native Debugger (Easier, Less Detail)

### Steps:

1. **Shake your phone** while the app is open
2. Select **"Debug"** from the menu
3. This will open Chrome DevTools
4. Go to the **Console** tab
5. You'll see `console.log()` messages there

## Method 3: Expo Go (If using Expo)

If you're using Expo Go app:
1. Open the app
2. Logs appear automatically in the Metro bundler terminal
3. Or shake phone → "Show Dev Menu" → "Debug Remote JS"

---

## What to Look For:

When you take a photo, look for these log lines:

```
[CameraScreen] ========================================
[CameraScreen] RAW MODEL OUTPUT:
[CameraScreen] Index 0 (Accepted score): 0.XXXX
[CameraScreen] Index 1 (Rejected score): 0.XXXX
[CameraScreen] ========================================

[Preprocess] RGB value range: [ XX , XX ]
[Preprocess] Normalized range: [ 0.XXXX , 0.XXXX ]
```

**Copy these values and send them to me!**

---

## Quick ADB Setup (if not installed):

1. Download Android Platform Tools: https://developer.android.com/tools/releases/platform-tools
2. Extract to `C:\platform-tools`
3. Add to PATH or run from that directory:
   ```powershell
   cd C:\platform-tools
   .\adb.exe logcat
   ```

---

## Troubleshooting:

**"adb is not recognized"**
- ADB not in PATH. Use full path: `C:\Users\jonny\AppData\Local\Android\Sdk\platform-tools\adb.exe`

**"No devices found"**
- Check USB debugging is enabled
- Try different USB cable
- Run: `adb devices` to see if phone is detected

**Too many logs**
- Filter by app: `adb logcat | Select-String "SmartCamera"`
- Or use: `adb logcat *:E` (errors only)
