# Dataset Folder

This folder contains training images for your SmartCameraApp model.

## 📁 Structure

```
dataset/
├── accepted/    ← Place "good" images here (images that should pass)
└── rejected/    ← Place "bad" images here (images that should fail)
```

## 📸 How to Collect Images

### Minimum Requirements:
- **10 images** in `accepted/` folder
- **10 images** in `rejected/` folder

### Recommended:
- **20-40 images** per folder for better accuracy

### Supported Formats:
- `.jpg`
- `.jpeg`
- `.png`

## 💡 Tips for Good Training Data

### ✅ DO:
- Use clear, focused images
- Include variety (different angles, lighting, backgrounds)
- Use images similar to what the app will see in production
- Balance the number of images in both folders
- Use consistent image quality

### ❌ DON'T:
- Use blurry or corrupted images
- Mix unrelated categories
- Use only one type of lighting/angle
- Have huge imbalance between classes

## 🎯 Example Use Cases

### Quality Control:
- **accepted/**: Good products, properly assembled items
- **rejected/**: Defective products, damaged items

### Document Verification:
- **accepted/**: Valid IDs, proper documents
- **rejected/**: Invalid IDs, expired documents

### Safety Compliance:
- **accepted/**: Proper PPE, correct setup
- **rejected/**: Missing PPE, unsafe conditions

### Food Recognition:
- **accepted/**: Fresh food, properly cooked
- **rejected/**: Spoiled food, undercooked

## 🚀 Next Steps

1. Add your images to the `accepted/` and `rejected/` folders
2. Run the training script: `python train_model.py`
3. Wait for training to complete (10-15 minutes)
4. Deploy the generated `demo_model.tflite` to your app

## 📊 Checking Your Dataset

To see how many images you have:

```bash
# Windows PowerShell
(Get-ChildItem dataset\accepted -Filter *.jpg).Count
(Get-ChildItem dataset\rejected -Filter *.jpg).Count

# Or just open the folders in File Explorer
```

---

**Ready to train? Make sure both folders have at least 10 images each, then run `python train_model.py`**
