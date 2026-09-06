# TensorFlow Lite Model Training Guide

This guide walks you through training a custom image classification model for the SmartCameraApp.

## 📚 Overview

You'll create a binary classifier that distinguishes between "accepted" and "rejected" images using transfer learning with MobileNetV2.

## 🎯 Requirements

- Python 3.8+
- TensorFlow 2.x
- A dataset of images (20-40 total)

## 📦 Setup

```bash
pip install tensorflow pillow numpy matplotlib
```

## 📁 Dataset Structure

Organize your images like this:

```
dataset/
├── accepted/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
└── rejected/
    ├── image1.jpg
    ├── image2.jpg
    └── ...
```

## 🔬 Training Script

Create `train_model.py`:

```python
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 8
EPOCHS = 20
DATASET_PATH = './dataset'

# Data augmentation for training
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    validation_split=0.2,
    zoom_range=0.2,
    shear_range=0.2
)

# Load training data
train_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

# Load validation data
validation_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# Build model with transfer learning
base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze base model
base_model.trainable = False

# Add custom classification head
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.5)(x)
predictions = Dense(2, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# Compile model
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Print model summary
model.summary()

# Train model
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    verbose=1
)

# Fine-tuning (optional but recommended)
print("\n=== Fine-tuning ===")
base_model.trainable = True

# Freeze early layers, only train last few
for layer in base_model.layers[:-20]:
    layer.trainable = False

# Recompile with lower learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Continue training
history_fine = model.fit(
    train_generator,
    epochs=10,
    validation_data=validation_generator,
    verbose=1
)

# Save Keras model
model.save('trained_model.h5')
print("Keras model saved as 'trained_model.h5'")

# Convert to TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Optimization (optional)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# Convert
tflite_model = converter.convert()

# Save TFLite model
with open('demo_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("\n✅ TFLite model saved as 'demo_model.tflite'")
print(f"Model size: {len(tflite_model) / 1024:.2f} KB")

# Test the TFLite model
interpreter = tf.lite.Interpreter(model_content=tflite_model)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print("\n=== Model Details ===")
print(f"Input shape: {input_details[0]['shape']}")
print(f"Input dtype: {input_details[0]['dtype']}")
print(f"Output shape: {output_details[0]['shape']}")
print(f"Output dtype: {output_details[0]['dtype']}")

# Test with a sample image
from PIL import Image

def test_inference(image_path):
    img = Image.open(image_path).convert('RGB')
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    
    print(f"\nTest image: {image_path}")
    print(f"Output: {output[0]}")
    print(f"Prediction: {'Accepted' if output[0][1] > output[0][0] else 'Rejected'}")
    print(f"Confidence: {max(output[0]) * 100:.2f}%")

# Test with sample images from your dataset
import os
test_image = os.path.join(DATASET_PATH, 'accepted', os.listdir(os.path.join(DATASET_PATH, 'accepted'))[0])
test_inference(test_image)
```

## 🚀 Training Steps

### 1. Prepare Your Dataset

Collect images that represent your use case:
- **Accepted images:** 10-20 examples of what should pass
- **Rejected images:** 10-20 examples of what should fail

Tips:
- Use varied lighting conditions
- Include different angles
- Capture at similar resolution to production use
- Ensure images are clear and representative

### 2. Run Training

```bash
python train_model.py
```

Expected output:
```
Epoch 1/20
...
Epoch 20/20
...
✅ TFLite model saved as 'demo_model.tflite'
Model size: 8.5 MB
```

### 3. Validate Model

Test your model with sample images:

```python
import tensorflow as tf
import numpy as np
from PIL import Image

# Load model
interpreter = tf.lite.Interpreter(model_path='demo_model.tflite')
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Test function
def predict_image(image_path):
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    
    return output[0]

# Test
result = predict_image('test_image.jpg')
print(f"Rejected: {result[0]:.3f}, Accepted: {result[1]:.3f}")
```

### 4. Deploy to App

**Android:**
```bash
cp demo_model.tflite android/app/src/main/assets/
```

**iOS:**
1. Open Xcode project
2. Drag `demo_model.tflite` into project
3. Ensure "Copy items if needed" is checked

### 5. Test in App

```bash
npm run android
# or
npm run ios
```

## 🎯 Model Optimization Tips

### Reduce Model Size

```python
# Quantization
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
```

### Improve Accuracy

1. **More data:** Collect 50-100 images per class
2. **Data augmentation:** Use more aggressive augmentation
3. **Fine-tuning:** Unfreeze more layers
4. **Longer training:** Increase epochs
5. **Better architecture:** Try EfficientNet instead of MobileNetV2

### Speed Up Inference

```python
# Use smaller model
base_model = MobileNetV2(alpha=0.5)  # 50% width

# Or use MobileNetV3
from tensorflow.keras.applications import MobileNetV3Small
base_model = MobileNetV3Small(...)
```

## 📊 Evaluating Performance

Create `evaluate_model.py`:

```python
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Load test data
test_datagen = ImageDataGenerator(rescale=1./255)
test_generator = test_datagen.flow_from_directory(
    './test_dataset',
    target_size=(224, 224),
    batch_size=1,
    class_mode='categorical',
    shuffle=False
)

# Load TFLite model
interpreter = tf.lite.Interpreter(model_path='demo_model.tflite')
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Predict all test images
predictions = []
true_labels = []

for i in range(len(test_generator)):
    img, label = test_generator[i]
    
    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    
    predictions.append(np.argmax(output[0]))
    true_labels.append(np.argmax(label[0]))

# Print metrics
print(classification_report(true_labels, predictions, target_names=['Rejected', 'Accepted']))
print("\nConfusion Matrix:")
print(confusion_matrix(true_labels, predictions))
```

## 🐛 Common Issues

### Low Accuracy
- Collect more diverse training data
- Increase training epochs
- Try data augmentation
- Check for class imbalance

### Model Too Large
- Use quantization
- Try smaller base model (MobileNetV2 with alpha=0.5)
- Remove unnecessary layers

### Slow Inference
- Use quantized model
- Reduce input size (try 192×192 instead of 224×224)
- Enable GPU delegate on device

## 📚 Resources

- [TensorFlow Lite Guide](https://www.tensorflow.org/lite/guide)
- [Transfer Learning Tutorial](https://www.tensorflow.org/tutorials/images/transfer_learning)
- [Model Optimization](https://www.tensorflow.org/lite/performance/model_optimization)

---

**Ready to train your model? Follow the steps above and deploy to SmartCameraApp!** 🚀
