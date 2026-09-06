# 🚀 Quick Start: Training Your Model

## ✅ Prerequisites Installed
- ✓ Python 3.12.6
- ✓ TensorFlow (installing now)
- ✓ Training script created: `train_model.py`
- ✓ Dataset folders created: `dataset/accepted/` and `dataset/rejected/`

## 📸 Step 1: Collect Your Images

You need to collect images for your specific use case. Here are some examples:

### Example Use Cases:
- **Quality Control:** Good products vs. defective products
- **Document Verification:** Valid IDs vs. invalid IDs
- **Food Recognition:** Fresh food vs. spoiled food
- **Safety Compliance:** Proper PPE vs. improper PPE

### Collection Guidelines:
1. **Quantity:** Minimum 10 images per class, ideally 20-40 per class
2. **Variety:** Include different:
   - Lighting conditions (bright, dim, natural light)
   - Angles (front, side, tilted)
   - Backgrounds
   - Distances from camera
3. **Quality:** Use clear, focused images
4. **Format:** JPG, JPEG, or PNG files

## 📁 Step 2: Organize Your Dataset

Place your images in the correct folders:

```
SmartCameraApp/
└── dataset/
    ├── accepted/          ← Put "good" images here
    │   ├── image1.jpg
    │   ├── image2.jpg
    │   └── ...
    └── rejected/          ← Put "bad" images here
        ├── image1.jpg
        ├── image2.jpg
        └── ...
```

**Important:** 
- The folder names MUST be exactly `accepted` and `rejected`
- Images can be any name, but use common formats (.jpg, .jpeg, .png)

## 🎯 Step 3: Run Training

Once TensorFlow installation completes, run:

```bash
python train_model.py
```

### What Happens During Training:
1. **Data Loading** (5-10 seconds)
   - Loads and validates your images
   - Shows dataset summary

2. **Model Building** (10-20 seconds)
   - Downloads MobileNetV2 base model (first time only)
   - Builds custom classification head

3. **Training Phase 1** (5-10 minutes)
   - Trains for 20 epochs
   - Shows progress for each epoch
   - Displays accuracy and loss

4. **Fine-tuning Phase** (3-5 minutes)
   - Fine-tunes last layers for 10 more epochs
   - Improves model accuracy

5. **Conversion & Testing** (5-10 seconds)
   - Converts to TensorFlow Lite format
   - Tests with sample images
   - Saves `demo_model.tflite`

### Expected Output:
```
============================================================
SmartCameraApp - Model Training Script
============================================================

📊 Dataset Summary:
   Accepted images: 15
   Rejected images: 15
   Total images: 30

...

✅ TFLite model saved as 'demo_model.tflite'
📦 Model size: 8500.00 KB
============================================================
```

## 📱 Step 4: Deploy to Your App

### For Android:
```bash
# Copy model to Android assets
copy demo_model.tflite android\app\src\main\assets\demo_model.tflite

# Rebuild and run
npm run android
```

### For iOS:
1. Open Xcode: `open ios/SmartCameraApp.xcodeproj`
2. Drag `demo_model.tflite` into the project navigator
3. Check "Copy items if needed"
4. Ensure it's added to the SmartCameraApp target
5. Build and run: `npm run ios`

## 🧪 Step 5: Test Your Model

1. Launch the app on your device
2. Tap "Open Camera"
3. Point camera at test subjects
4. Tap capture button
5. View results (Accepted ✅ or Rejected ❌)

## 🔧 Troubleshooting

### "Dataset folder not found"
- Make sure you're running the script from the SmartCameraApp directory
- Verify `dataset/accepted/` and `dataset/rejected/` folders exist

### "Missing accepted or rejected folders"
- Check folder names are exactly `accepted` and `rejected` (lowercase)

### "Very small dataset" warning
- This means you have fewer than 5 images per class
- Model will still train but may not be accurate
- Collect more images for better results

### Low accuracy during training
- Collect more diverse images
- Ensure images are clear and representative
- Check that images are correctly categorized

### Model file not found in app
- **Android:** Verify file is in `android/app/src/main/assets/`
- **iOS:** Check file is added to Xcode project and included in target
- Rebuild the app after adding the model

## 📊 Understanding Training Output

### Accuracy Metrics:
- **Training accuracy:** How well model performs on training data
- **Validation accuracy:** How well model performs on unseen data
- **Target:** Aim for >85% validation accuracy

### Loss Metrics:
- Lower is better
- Should decrease over epochs
- If loss increases, model may be overfitting

## 🎨 Example Training Session

```bash
# 1. Check your dataset
dir dataset\accepted
dir dataset\rejected

# 2. Run training
python train_model.py

# 3. Wait for completion (10-15 minutes)

# 4. Verify output file exists
dir demo_model.tflite

# 5. Deploy to app
copy demo_model.tflite android\app\src\main\assets\
npm run android
```

## 💡 Tips for Better Results

### Image Collection:
- ✅ Use consistent image resolution
- ✅ Include edge cases
- ✅ Balance classes (equal number of accepted/rejected)
- ❌ Don't use blurry or corrupted images
- ❌ Don't mix unrelated categories

### Training:
- First training takes longer (downloads base model)
- Subsequent trainings are faster
- Save your dataset for retraining later
- Keep original images in case you need to retrain

### Model Performance:
- Test with images NOT in your training set
- If accuracy is low, collect more diverse images
- If model is too large, see MODEL_TRAINING_GUIDE.md for optimization

## 📚 Additional Resources

- **Detailed Training Guide:** See `MODEL_TRAINING_GUIDE.md`
- **App Documentation:** See `README.md`
- **Deployment Guide:** See `DEPLOYMENT.md`

## 🎯 Quick Checklist

- [ ] Python and TensorFlow installed
- [ ] Collected 10+ images per class
- [ ] Images organized in `dataset/accepted/` and `dataset/rejected/`
- [ ] Ran `python train_model.py`
- [ ] Training completed successfully
- [ ] `demo_model.tflite` file created
- [ ] Model copied to app assets folder
- [ ] App rebuilt and tested on device

---

**Need help? Check the troubleshooting section above or refer to MODEL_TRAINING_GUIDE.md for advanced options.**
