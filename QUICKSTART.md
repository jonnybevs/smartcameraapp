# 🚀 Quick Start Guide

Get SmartCameraApp running in 10 minutes!

## ⚡ Prerequisites Check

```bash
node --version    # Should be >= 18
npm --version     # Should be >= 8
```

## 📦 Step 1: Install Dependencies

```bash
cd SmartCameraApp
npm install
```

## 🍎 Step 2: iOS Setup (Mac only)

```bash
cd ios
pod install
cd ..
```

## 📱 Step 3: Add Your Model

### Option A: Use Placeholder (for testing structure)
The app is ready to run but will show an error until you add a real model.

### Option B: Add Your Trained Model

**Android:**
```bash
# Copy your model file
cp /path/to/your/demo_model.tflite android/app/src/main/assets/
```

**iOS:**
1. Open `ios/SmartCameraApp.xcworkspace` in Xcode
2. Drag your `demo_model.tflite` into the project navigator
3. Check "Copy items if needed"
4. Ensure it's added to the SmartCameraApp target

## 🏃 Step 4: Run the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## ✅ What to Expect

1. **Home Screen** - Shows "Model Status: Ready" when model loads
2. **Camera Screen** - Tap "Open Camera" to capture an image
3. **Result Screen** - See "Accepted" or "Rejected" with confidence score

## 🎯 Next Steps

### Don't have a model yet?

Follow the [MODEL_TRAINING_GUIDE.md](./MODEL_TRAINING_GUIDE.md) to train your own:

```bash
# Quick training example
pip install tensorflow pillow numpy

# Create dataset structure
mkdir -p dataset/accepted dataset/rejected

# Add 10-20 images to each folder
# Then run training script (see guide)
```

### Want to customize?

- **Change colors:** Edit styles in `src/screens/*.tsx`
- **Modify UI:** Update screen components
- **Add features:** Extend the navigation or add new screens

## 🐛 Common Issues

### "Model not found"
- Ensure `demo_model.tflite` is in the correct assets folder
- Rebuild the app after adding the model

### "Camera permission denied"
- Grant camera permission in device settings
- Restart the app

### Build errors
```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npm run android

# Or for iOS
cd ios && pod install && cd ..
npm run ios
```

## 📚 Full Documentation

- [README.md](./README.md) - Complete project overview
- [MODEL_TRAINING_GUIDE.md](./MODEL_TRAINING_GUIDE.md) - Train your model
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to app stores

## 💡 Tips

1. **Test on real device** - Camera doesn't work in simulators
2. **Start simple** - Use 10-20 images per class for initial testing
3. **Iterate quickly** - Train → Test → Improve → Repeat

## 🎉 You're Ready!

The app is now running. Capture an image and see the ML inference in action!

---

**Need help?** Check the full [README.md](./README.md) or [troubleshooting section](./README.md#-troubleshooting)
