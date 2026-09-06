# Deployment Guide

Complete guide for deploying SmartCameraApp to physical devices and app stores.

## 📱 Testing on Physical Devices

### Android Device

1. **Enable Developer Mode**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Enable "USB Debugging" in Developer Options

2. **Connect Device**
   ```bash
   # Check device is connected
   adb devices
   ```

3. **Run App**
   ```bash
   npm run android
   ```

### iOS Device

1. **Requirements**
   - Apple Developer Account (free or paid)
   - Device registered in Xcode

2. **Configure Signing**
   - Open `ios/SmartCameraApp.xcworkspace` in Xcode
   - Select SmartCameraApp target
   - Go to "Signing & Capabilities"
   - Select your Team

3. **Run App**
   ```bash
   npm run ios --device
   ```

## 🏗️ Building Release Versions

### Android APK/AAB

1. **Generate Signing Key**
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
   cd ../..
   ```

2. **Configure Gradle**
   
   Edit `android/gradle.properties`:
   ```properties
   RELEASE_STORE_FILE=release.keystore
   RELEASE_KEY_ALIAS=release
   RELEASE_STORE_PASSWORD=your_password
   RELEASE_KEY_PASSWORD=your_password
   ```

   Edit `android/app/build.gradle`:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               if (project.hasProperty('RELEASE_STORE_FILE')) {
                   storeFile file(RELEASE_STORE_FILE)
                   storePassword RELEASE_STORE_PASSWORD
                   keyAlias RELEASE_KEY_ALIAS
                   keyPassword RELEASE_KEY_PASSWORD
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
           }
       }
   }
   ```

3. **Build APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   
   Output: `android/app/build/outputs/apk/release/app-release.apk`

4. **Build AAB (for Play Store)**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS IPA

1. **Archive in Xcode**
   - Open `ios/SmartCameraApp.xcworkspace`
   - Select "Any iOS Device" as target
   - Product → Archive
   - Wait for archive to complete

2. **Export IPA**
   - Window → Organizer
   - Select your archive
   - Click "Distribute App"
   - Choose distribution method:
     - **Ad Hoc:** For testing on registered devices
     - **App Store:** For App Store submission
     - **Enterprise:** For enterprise distribution

3. **Or use Command Line**
   ```bash
   cd ios
   xcodebuild -workspace SmartCameraApp.xcworkspace \
              -scheme SmartCameraApp \
              -configuration Release \
              -archivePath build/SmartCameraApp.xcarchive \
              archive
   
   xcodebuild -exportArchive \
              -archivePath build/SmartCameraApp.xcarchive \
              -exportPath build \
              -exportOptionsPlist ExportOptions.plist
   ```

## 🚀 App Store Deployment

### Google Play Store

1. **Prepare Assets**
   - App icon (512×512 PNG)
   - Feature graphic (1024×500 PNG)
   - Screenshots (at least 2)
   - Privacy policy URL
   - App description

2. **Create App in Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Fill in app details

3. **Upload AAB**
   - Go to Production → Create new release
   - Upload `app-release.aab`
   - Add release notes
   - Review and rollout

4. **Complete Store Listing**
   - Add screenshots
   - Write description
   - Set category and tags
   - Submit for review

### Apple App Store

1. **Prepare Assets**
   - App icon (1024×1024 PNG)
   - Screenshots for all device sizes
   - Privacy policy URL
   - App description

2. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - My Apps → + → New App
   - Fill in app information

3. **Upload Build**
   - Use Xcode Organizer, or
   - Use Transporter app, or
   - Use command line with `xcrun altool`

4. **Complete App Information**
   - Add screenshots
   - Write description
   - Set pricing
   - Submit for review

## 🔧 Configuration for Production

### Environment Variables

Create `.env` file:
```
API_URL=https://your-api.com
ANALYTICS_KEY=your_key
```

Install dotenv:
```bash
npm install react-native-dotenv
```

### App Icons

**Android:**
Place icons in:
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72×72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48×48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96×96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144×144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192×192)

**iOS:**
Add icon set to `ios/SmartCameraApp/Images.xcassets/AppIcon.appiconset/`

### Splash Screen

**Android:**
Edit `android/app/src/main/res/drawable/launch_screen.xml`

**iOS:**
Edit `ios/SmartCameraApp/LaunchScreen.storyboard`

## 📊 Analytics & Monitoring

### Add Firebase (Optional)

1. **Install**
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/analytics
   ```

2. **Configure Android**
   - Download `google-services.json` from Firebase Console
   - Place in `android/app/`

3. **Configure iOS**
   - Download `GoogleService-Info.plist` from Firebase Console
   - Add to Xcode project

### Add Crash Reporting

```bash
npm install @react-native-firebase/crashlytics
```

## 🔐 Security Checklist

- [ ] Remove all console.log statements
- [ ] Obfuscate code (ProGuard for Android)
- [ ] Use HTTPS for any network requests
- [ ] Validate all user inputs
- [ ] Store sensitive data securely
- [ ] Enable SSL pinning if using APIs
- [ ] Review permissions in manifests
- [ ] Test on multiple devices
- [ ] Run security audit: `npm audit`

## 📝 Pre-Launch Checklist

- [ ] Test on multiple devices (Android & iOS)
- [ ] Test with different screen sizes
- [ ] Test camera on different devices
- [ ] Verify model loads correctly
- [ ] Test offline functionality
- [ ] Check app permissions
- [ ] Verify app icons and splash screens
- [ ] Test app performance
- [ ] Review crash reports
- [ ] Prepare marketing materials
- [ ] Write release notes
- [ ] Update version numbers

## 🔄 Version Management

Update version in:

**Android:** `android/app/build.gradle`
```gradle
android {
    defaultConfig {
        versionCode 2
        versionName "1.1.0"
    }
}
```

**iOS:** Xcode project settings
- Version: 1.1.0
- Build: 2

**package.json:**
```json
{
  "version": "1.1.0"
}
```

## 🐛 Troubleshooting Production Issues

### App Crashes on Launch
- Check native logs: `adb logcat` (Android) or Xcode console (iOS)
- Verify model file is included in build
- Check for missing dependencies

### Model Not Loading
- Ensure model is in correct assets folder
- Verify model file size (should be < 100MB)
- Check file permissions

### Camera Not Working
- Verify permissions in manifest/Info.plist
- Test on physical device (camera doesn't work in simulator)
- Check camera library version compatibility

## 📚 Resources

- [React Native Deployment](https://reactnative.dev/docs/signed-apk-android)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Fastlane](https://fastlane.tools/) - Automate deployments

---

**Ready to deploy? Follow this guide step by step!** 🚀
