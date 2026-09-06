# SmartCameraApp - On-Device ML Camera Criteria Checker

A cross-platform React Native mobile app that performs **real-time on-device image classification** using TensorFlow Lite. This app captures images via the camera and runs ML inference completely offline.

## 🎯 Features

- ✅ **Real TensorFlow Lite Integration** - Native modules for Android & iOS
- 📷 **Camera Integration** - Using react-native-vision-camera
- 🔒 **Fully Offline** - No cloud processing, all inference on-device
- 📱 **Cross-Platform** - Works on Android (SDK 24+) and iOS (13+)
- 🎨 **Modern UI** - Clean, intuitive interface with pass/fail results
- ⚡ **Fast Inference** - Optimized native code with multi-threading

## 📋 Prerequisites

- Node.js >= 18
- React Native development environment set up
- **Android:**
  - Android Studio
  - Android SDK (API 24+)
  - Java JDK 11+
- **iOS:**
  - Xcode 14+
  - CocoaPods
  - macOS (for iOS development)

## 🚀 Installation

### 1. Clone and Install Dependencies

```bash
cd SmartCameraApp
npm install
```

### 2. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 3. Add Your TensorFlow Lite Model

#### For Android:
Place your trained `.tflite` model file at:
```
android/app/src/main/assets/demo_model.tflite
```

#### For iOS:
1. Open `ios/SmartCameraApp.xcodeproj` in Xcode
2. Drag and drop your `demo_model.tflite` file into the project
3. Ensure "Copy items if needed" is checked
4. Add to target: SmartCameraApp

## 🏃 Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## 🧠 Model Requirements

Your TensorFlow Lite model must meet these specifications:

- **Input:** 224×224 RGB image (float32)
- **Output:** 2 classes (float32 array)
  - Index 0: "Not accepted" score
  - Index 1: "Accepted" score
- **Format:** `.tflite` file

### Example Model Architecture

```python
# Suggested training architecture
input_shape = (224, 224, 3)
base_model = MobileNetV2(input_shape=input_shape, include_top=False, weights='imagenet')
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
predictions = Dense(2, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)
```

## 📦 Project Structure

```
SmartCameraApp/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Main landing screen
│   │   ├── CameraScreen.tsx        # Camera capture screen
│   │   └── ResultScreen.tsx        # Results display
│   ├── ml/
│   │   ├── tflite.ts              # TFLite bridge module
│   │   └── preprocess.ts          # Image preprocessing
│   ├── components/
│   │   └── CaptureButton.tsx      # Camera capture button
│   └── navigation/
│       └── index.tsx              # Navigation setup
├── android/
│   └── app/src/main/
│       ├── java/com/smartcameraapp/
│       │   ├── TFLiteModule.java  # Android native module
│       │   └── TFLitePackage.java
│       └── assets/
│           └── demo_model.tflite  # Place your model here
├── ios/
│   ├── TFLiteModule.swift         # iOS native module
│   ├── TFLiteModule.m             # Objective-C bridge
│   └── SmartCameraApp/
│       └── demo_model.tflite      # Place your model here
└── package.json
```

## 🔧 How It Works

### 1. Model Loading
On app startup, the TFLite model is loaded from the app bundle into memory.

### 2. Image Capture
User taps the capture button, and the camera takes a photo.

### 3. Preprocessing
The captured image is:
- Resized to 224×224
- Converted to RGB
- Normalized to [0, 1] range
- Flattened into a float array

### 4. Inference
The preprocessed image tensor is passed to the TFLite interpreter, which runs the model and returns class scores.

### 5. Result Display
The app interprets the output:
- If `output[1] > output[0]` → **Accepted** ✓
- Otherwise → **Rejected** ✗

## 🎓 Training Your Own Model

### Step 1: Prepare Dataset
Collect 20-40 images:
- 10-20 positive examples (images that should be accepted)
- 10-20 negative examples (images that should be rejected)

### Step 2: Train Model
```python
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# Load and preprocess your dataset
# ... (your data loading code)

# Build model
base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
predictions = Dense(2, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# Compile and train
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(train_data, train_labels, epochs=10, validation_split=0.2)

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

# Save
with open('demo_model.tflite', 'wb') as f:
    f.write(tflite_model)
```

### Step 3: Replace Model File
Copy the generated `demo_model.tflite` to:
- Android: `android/app/src/main/assets/`
- iOS: Add to Xcode project

### Step 4: Rebuild and Test
```bash
# Android
npm run android

# iOS
npm run ios
```

## 🛠️ Troubleshooting

### Model Not Loading
- **Android:** Ensure model is in `android/app/src/main/assets/`
- **iOS:** Verify model is added to Xcode project and included in target

### Camera Permission Issues
- **Android:** Check `AndroidManifest.xml` has camera permissions
- **iOS:** Verify `Info.plist` has camera usage description

### Build Errors
```bash
# Clean and rebuild Android
cd android
./gradlew clean
cd ..
npm run android

# Clean and rebuild iOS
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### TensorFlow Lite Errors
- Verify model input shape is 224×224×3
- Ensure model output has 2 classes
- Check model was exported correctly from training

## 📱 Supported Platforms

- **Android:** API Level 24+ (Android 7.0+)
- **iOS:** iOS 13.0+

## 🔐 Privacy

This app processes all images **on-device**. No data is sent to external servers or cloud services.

## 📄 License

This project is provided as-is for demonstration purposes.

## 🤝 Contributing

This is a demo project. Feel free to fork and modify for your needs.

## 📞 Support

For issues related to:
- **React Native:** Check [React Native docs](https://reactnative.dev/)
- **TensorFlow Lite:** Check [TFLite docs](https://www.tensorflow.org/lite)
- **Camera:** Check [react-native-vision-camera docs](https://react-native-vision-camera.com/)

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Set up iOS: `cd ios && pod install && cd ..`
3. Add your trained model to assets
4. Run on device: `npm run android` or `npm run ios`
5. Test with your target images

---

**Built with React Native + TensorFlow Lite for fully offline ML inference** 🚀
