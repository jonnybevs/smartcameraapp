# 🔧 Installing Required Software for Model Training

## Issue Detected
Your Python installation has permission restrictions. Follow these steps to install TensorFlow properly.

## ✅ Solution: Run PowerShell as Administrator

### Step 1: Open PowerShell as Administrator
1. Press `Windows + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted for permissions

### Step 2: Navigate to Project Directory
```powershell
cd C:\Users\jonny\CascadeProjects\SmartCameraApp
```

### Step 3: Install Required Packages
```powershell
pip install tensorflow pillow numpy matplotlib scikit-learn
```

**This will take 5-10 minutes** as TensorFlow is a large package (~350 MB).

### Step 4: Verify Installation
```powershell
python -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__)"
```

You should see: `TensorFlow version: 2.21.0` (or similar)

---

## 🔄 Alternative: Use Virtual Environment (Recommended)

If you continue having permission issues, use a virtual environment:

### Create Virtual Environment
```powershell
# In your project directory
python -m venv ml_env
```

### Activate Virtual Environment
```powershell
# Windows PowerShell
.\ml_env\Scripts\Activate.ps1

# Windows Command Prompt
.\ml_env\Scripts\activate.bat
```

### Install Packages in Virtual Environment
```powershell
pip install tensorflow pillow numpy matplotlib scikit-learn
```

### Run Training (with virtual environment activated)
```powershell
python train_model.py
```

### Deactivate When Done
```powershell
deactivate
```

---

## 📦 What Gets Installed

| Package | Purpose | Size |
|---------|---------|------|
| **tensorflow** | Machine learning framework | ~350 MB |
| **pillow** | Image processing | ~3 MB |
| **numpy** | Numerical operations | ~13 MB |
| **matplotlib** | Plotting (optional) | ~9 MB |
| **scikit-learn** | ML utilities | ~8 MB |

**Total:** ~380 MB

---

## ✅ Quick Start After Installation

Once packages are installed:

1. **Collect images** (10-20 per class minimum)
   - Place in `dataset/accepted/`
   - Place in `dataset/rejected/`

2. **Run training:**
   ```powershell
   python train_model.py
   ```

3. **Wait 10-15 minutes** for training to complete

4. **Deploy model:**
   ```powershell
   # For Android
   copy demo_model.tflite android\app\src\main\assets\
   npm run android
   ```

---

## 🐛 Troubleshooting

### "Access is denied" error
- Run PowerShell as Administrator (see Step 1 above)
- Or use virtual environment approach

### "ModuleNotFoundError: No module named 'tensorflow'"
- Installation didn't complete successfully
- Try the virtual environment approach
- Or reinstall: `pip uninstall tensorflow` then `pip install tensorflow`

### Installation is very slow
- TensorFlow is large (~350 MB), this is normal
- Ensure stable internet connection
- May take 10-20 minutes on slower connections

### "No module named 'pip'"
- Your pip installation is corrupted
- Download get-pip.py: https://bootstrap.pypa.io/get-pip.py
- Run: `python get-pip.py`

---

## 🎯 Next Steps

After successful installation, see **TRAINING_INSTRUCTIONS.md** for complete training guide.
