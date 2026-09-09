import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import os
from datetime import datetime

# Model Version
MODEL_VERSION = "v1.4"  # Increment this with each training iteration
TRAINING_DATE = datetime.now().strftime("%Y-%m-%d %H:%M")

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 8
EPOCHS = 100  # Significantly increased for deeper learning
DATASET_PATH = './dataset'
FINE_TUNE_EPOCHS = 80  # Much longer fine-tuning for better adaptation

print("=" * 60)
print("SmartCameraApp - Model Training Script")
print(f"Model Version: {MODEL_VERSION}")
print(f"Training Date: {TRAINING_DATE}")
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

# Data augmentation for training - realistic transforms only
print("\n🔄 Setting up data augmentation...")
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=15,  # Moderate rotation (realistic camera angles)
    width_shift_range=0.15,  # Slight horizontal shift
    height_shift_range=0.15,  # Slight vertical shift
    horizontal_flip=False,  # Don't flip - ladder orientation matters
    zoom_range=0.2,  # Moderate zoom
    brightness_range=[0.6, 1.4],  # Lighting variation (important for your use case)
    fill_mode='nearest',
    validation_split=0.2
)

# Validation data - NO augmentation, only rescaling
print("🔄 Setting up validation data (no augmentation)...")
val_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
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

# Load validation data (using val_datagen without augmentation)
print("📂 Loading validation data...")
validation_generator = val_datagen.flow_from_directory(
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

# Calculate class weights to handle imbalance
class_counts = {}
for class_name, class_idx in train_generator.class_indices.items():
    if class_name == 'accepted':
        class_counts[class_idx] = accepted_count
    else:
        class_counts[class_idx] = rejected_count

total_samples = sum(class_counts.values())
class_weights = {}
for class_idx, count in class_counts.items():
    class_weights[class_idx] = total_samples / (len(class_counts) * count)

print(f"\n⚖️  Class Imbalance Handling:")
print(f"   Accepted images: {accepted_count}")
print(f"   Rejected images: {rejected_count}")
print(f"   Class weights: {class_weights}")
print(f"   (Higher weight = more important during training)")

# Build model with transfer learning
print("\n🏗️  Building model with MobileNetV2...")
base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Initially freeze base model for transfer learning
base_model.trainable = False

# Add custom classification head with more capacity
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)  # Increased neurons
x = Dropout(0.5)(x)
x = Dense(128, activation='relu')(x)  # Added another layer
x = Dropout(0.3)(x)
predictions = Dense(2, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# Compile model for initial training
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Print model summary
print("\n📋 Model Architecture:")
model.summary()

# Phase 1: Train with frozen base model
print(f"\n🚀 Phase 1: Initial training for {EPOCHS} epochs...")
print("   (Base model frozen, training classification head only)")
print("=" * 60)

# Advanced callbacks for Phase 1
phase1_callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=20,  # Increased patience for longer training
        restore_best_weights=True,
        verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.3,  # More aggressive reduction
        patience=8,
        min_lr=1e-8,
        verbose=1
    ),
    tf.keras.callbacks.ModelCheckpoint(
        'best_model_phase1.h5',
        monitor='val_loss',
        save_best_only=True,
        verbose=1
    )
]

history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    class_weight=class_weights,  # Apply class weights to handle imbalance
    verbose=1,
    callbacks=phase1_callbacks
)

# Phase 2: Fine-tuning with more layers unfrozen
print("\n" + "=" * 60)
print("🔧 Phase 2: Fine-tuning model...")
print(f"   Unfreezing last 80 layers of base model (deeper fine-tuning)")
print(f"   Training for {FINE_TUNE_EPOCHS} additional epochs")
print("=" * 60)
base_model.trainable = True

# Unfreeze even more layers for deeper fine-tuning (last 80 layers)
for layer in base_model.layers[:-80]:
    layer.trainable = False

print(f"\n📊 Trainable layers: {sum([1 for layer in model.layers if layer.trainable])}")
print(f"   Total layers: {len(model.layers)}")

# Recompile with very low learning rate for fine-tuning
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=5e-5),  # Lower initial LR
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Advanced callbacks for Phase 2 with cosine annealing
phase2_callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=25,  # Very patient for long fine-tuning
        restore_best_weights=True,
        verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,  # Aggressive reduction
        patience=10,
        min_lr=1e-9,
        verbose=1
    ),
    tf.keras.callbacks.ModelCheckpoint(
        'best_model_phase2.h5',
        monitor='val_loss',
        save_best_only=True,
        verbose=1
    )
]

# Continue training with fine-tuning
history_fine = model.fit(
    train_generator,
    epochs=FINE_TUNE_EPOCHS,
    validation_data=validation_generator,
    class_weight=class_weights,  # Apply class weights in fine-tuning too
    verbose=1,
    callbacks=phase2_callbacks
)

# Save Keras model with version
print("\n💾 Saving Keras model...")
model.save('trained_model.h5')
print(f"✅ Keras model saved as 'trained_model.h5' ({MODEL_VERSION})")

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

# Save version info to text file
version_info = f"""Model Version: {MODEL_VERSION}
Training Date: {TRAINING_DATE}
Dataset Size: {accepted_count} accepted, {rejected_count} rejected
Architecture: MobileNetV2 + Custom Head (256->128->2)
Training: {EPOCHS} epochs (frozen) + {FINE_TUNE_EPOCHS} epochs (fine-tuned 80 layers)
Augmentation: Rotation ±15°, Zoom 20%, Brightness 0.6-1.4
Learning Rate: 0.001 -> 5e-5 with ReduceLROnPlateau
Callbacks: EarlyStopping (patience 20/25), ModelCheckpoint, ReduceLROnPlateau
Total Possible Epochs: {EPOCHS + FINE_TUNE_EPOCHS} (with early stopping)
"""

with open('model_version.txt', 'w') as f:
    f.write(version_info)

print("\n" + "=" * 60)
print(f"✅ TFLite model saved as 'demo_model.tflite' ({MODEL_VERSION})")
print(f"📦 Model size: {len(tflite_model) / 1024:.2f} KB")
print(f"📄 Version info saved to 'model_version.txt'")
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
    print(f"   Output scores: [Accepted: {output[0][0]:.3f}, Rejected: {output[0][1]:.3f}]")
    print(f"   Prediction: {'✅ Accepted' if output[0][0] > output[0][1] else '❌ Rejected'}")
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
print(f"\n� Model Version: {MODEL_VERSION}")
print(f"📅 Trained: {TRAINING_DATE}")
print("\n�📝 Next Steps:")
print("1. Copy 'demo_model.tflite' to your app:")
print("   - Android: android/app/src/main/assets/")
print("   - iOS: Add to Xcode project")
print("2. Copy 'model_version.txt' for reference")
print("3. Rebuild your app: npm run android or npm run ios")
print("4. Test with real images!")
print("\n" + "=" * 60)
