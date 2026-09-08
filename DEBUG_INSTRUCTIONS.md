# 🔍 Debug Instructions - Model File Not Found

## 📱 Where the Model Should Be on Device

The `demo_model.tflite` file should be packaged **inside the APK** at:
```
/data/app/com.smartcameraapp-[random]/base.apk!/assets/demo_model.tflite
```

**You cannot directly browse to this location** because it's inside the APK archive. The Android AssetManager loads it from there.

## 🔎 How to Verify the Model is in the APK

### Option 1: Using a Computer
1. Copy the APK to your computer
2. Rename `app-release.apk` to `app-release.zip`
3. Extract the ZIP file
4. Look for `assets/demo_model.tflite` inside
5. Check the file size (should be ~2.68 MB)

### Option 2: Using Android File Manager
Some file managers can browse inside APK files:
1. Install **ZArchiver** or **RAR** from Play Store
2. Navigate to your APK file
3. Open it as an archive
4. Check if `assets/demo_model.tflite` exists

## 📋 How to Get Error Logs

### Method 1: Using ADB (Recommended)

**Prerequisites:**
- Enable Developer Options on your phone (Settings → About Phone → Tap "Build Number" 7 times)
- Enable USB Debugging (Settings → Developer Options → USB Debugging)
- Install ADB on your computer

**Get Logs:**
```bash
# Connect phone via USB
adb devices

# Clear old logs
adb logcat -c

# Start the app and reproduce the error

# View logs filtered for your app
adb logcat | findstr "smartcameraapp"

# Or save to file
adb logcat > app_logs.txt
```

**Look for lines containing:**
- `TFLiteModule`
- `MODEL_LOAD_ERROR`
- `Failed to load model`
- `IOException`

### Method 2: Using Logcat Reader App (Easier)

1. Install **Logcat Reader** or **MatLog** from Play Store
2. Grant necessary permissions
3. Open the app
4. Start the SmartCameraApp
5. Look for errors containing "smartcameraapp" or "TFLite"

### Method 3: React Native Debug Console

If you can run the app in development mode:
```bash
# In your project directory
npx react-native run-android

# Watch Metro bundler output for errors
```

## 🐛 Common Issues & Solutions

### Issue 1: Model File Not in APK
**Symptom:** File doesn't exist when you check inside the APK

**Solution:** The assets folder wasn't included in the build
- Verify `android/app/src/main/assets/demo_model.tflite` exists locally
- Check file size is ~2.68 MB
- Rebuild ensuring assets are included

### Issue 2: Wrong File Path
**Symptom:** Error says "file not found" but file is in APK

**Possible causes:**
- Path should be `demo_model.tflite` (not `/assets/demo_model.tflite`)
- File extension must be included
- Case-sensitive on some systems

### Issue 3: TensorFlow Lite Dependencies Missing
**Symptom:** Error about TensorFlow classes not found

**Check:** `android/app/build.gradle` should have:
```gradle
implementation 'org.tensorflow:tensorflow-lite:2.14.0'
implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
```

### Issue 4: Native Module Not Registered
**Symptom:** "TFLiteModule is not available"

**Check:** `MainApplication.java` should have:
```java
packages.add(new TFLitePackage());
```

## 🔧 Next Steps Based on Findings

### If model file IS in the APK:
The issue is with the loading code. We need to see the exact error message from logcat.

### If model file is NOT in the APK:
The assets folder isn't being included in the build. We need to fix the build configuration.

### If you can't get logs:
I can create a debug version of the app that shows more detailed error messages on screen.

## 📞 What to Report Back

Please provide:
1. ✅ Is `assets/demo_model.tflite` in the APK? (Yes/No)
2. ✅ File size if it exists
3. ✅ Any error messages from logcat (copy/paste the relevant lines)
4. ✅ Exact error message shown in the app

This will help me pinpoint the exact issue and fix it!
