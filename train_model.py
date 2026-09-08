import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import os

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 8
EPOCHS = 20
DATASET_PATH = './dataset'

print("=" * 60)
print("SmartCameraApp - Model Training Script")
print("=" * 60)

# Check if dataset exists
if not os.path.exists(DATASET_PATH):
    print(f"\n❌ ERROR: Dataset folder '{DATASET_PATH}' not found!")
    print("\nPlease create the following structure:")
    print("dataset/")
    print("├── accepted/")
    print("│   ├── image1.jpg")
    print("│   └── ...")
    print("└── rejected/")
    print("    ├── image1.jpg")
    print("    └── ...")
    exit(1)

# Check for accepted and rejected folders
accepted_path = os.path.join(DATASET_PATH, 'accepted')
rejected_path = os.path.join(DATASET_PATH, 'rejected')

if not os.path.exists(accepted_path) or not os.path.exists(rejected_path):
    print(f"\n❌ ERROR: Missing 'accepted' or 'rejected' folders in dataset!")
    exit(1)

accepted_count = len([f for f in os.listdir(accepted_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
rejected_count = len([f for f in os.listdir(rejected_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

print(f"\n📊 Dataset Summary:")
print(f"   Accepted images: {accepted_count}")
print(f"   Rejected images: {rejected_count}")
print(f"   Total images: {accepted_count + rejected_count}")

if accepted_count < 5 or rejected_count < 5:
    print("\n⚠️  WARNING: Very small dataset! Recommend at least 10 images per class.")
    print("   Model may not generalize well with this few examples.")

# Data augmentation for training
print("\n🔄 Setting up data augmentation...")
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
print("📂 Loading training data...")
train_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

# Load validation data
print("📂 Loading validation data...")
validation_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

print(f"\n✅ Data loaded successfully!")
print(f"   Training samples: {train_generator.samples}")
print(f"   Validation samples: {validation_generator.samples}")
print(f"   Class mapping: {train_generator.class_indices}")

# Build model with transfer learning
print("\n🏗️  Building model with MobileNetV2...")
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
print("\n📋 Model Architecture:")
model.summary()

# Train model
print(f"\n🚀 Starting training for {EPOCHS} epochs...")
print("=" * 60)
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    verbose=1
)

# Fine-tuning (optional but recommended)
print("\n" + "=" * 60)
print("🔧 Fine-tuning model...")
print("=" * 60)
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
print("\n💾 Saving Keras model...")
model.save('trained_model.h5')
print("✅ Keras model saved as 'trained_model.h5'")

# Convert to TensorFlow Lite
print("\n🔄 Converting to TensorFlow Lite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# NO optimization - we want the full model size
# Removing optimizations to keep full precision weights
# converter.optimizations = [tf.lite.Optimize.DEFAULT]  # DISABLED

# Convert
tflite_model = converter.convert()

# Save TFLite model
with open('demo_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("\n" + "=" * 60)
print("✅ TFLite model saved as 'demo_model.tflite'")
print(f"📦 Model size: {len(tflite_model) / 1024:.2f} KB")
print("=" * 60)

# Test the TFLite model
print("\n🧪 Testing TFLite model...")
interpreter = tf.lite.Interpreter(model_content=tflite_model)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print("\n📊 Model Details:")
print(f"   Input shape: {input_details[0]['shape']}")
print(f"   Input dtype: {input_details[0]['dtype']}")
print(f"   Output shape: {output_details[0]['shape']}")
print(f"   Output dtype: {output_details[0]['dtype']}")

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
    
    print(f"\n   Test image: {os.path.basename(image_path)}")
    print(f"   Output scores: [Rejected: {output[0][0]:.3f}, Accepted: {output[0][1]:.3f}]")
    print(f"   Prediction: {'✅ Accepted' if output[0][1] > output[0][0] else '❌ Rejected'}")
    print(f"   Confidence: {max(output[0]) * 100:.2f}%")

# Test with sample images from your dataset
print("\n🧪 Testing with sample images:")
if accepted_count > 0:
    test_image = os.path.join(accepted_path, [f for f in os.listdir(accepted_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))][0])
    test_inference(test_image)

if rejected_count > 0:
    test_image = os.path.join(rejected_path, [f for f in os.listdir(rejected_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))][0])
    test_inference(test_image)

print("\n" + "=" * 60)
print("🎉 Training Complete!")
print("=" * 60)
print("\n📝 Next Steps:")
print("1. Copy 'demo_model.tflite' to your app:")
print("   - Android: android/app/src/main/assets/")
print("   - iOS: Add to Xcode project")
print("2. Rebuild your app: npm run android or npm run ios")
print("3. Test with real images!")
print("\n" + "=" * 60)
