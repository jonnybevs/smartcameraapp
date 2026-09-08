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
EPOCHS = 50  # Increased for better training
DATASET_PATH = './dataset'
FINE_TUNE_EPOCHS = 30  # Additional epochs for fine-tuning

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

# Aggressive data augmentation for training
print("\n🔄 Setting up aggressive data augmentation...")
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=40,  # Increased rotation
    width_shift_range=0.3,  # More horizontal shift
    height_shift_range=0.3,  # More vertical shift
    horizontal_flip=True,
    vertical_flip=True,  # Added vertical flip
    validation_split=0.2,
    zoom_range=0.3,  # More zoom variation
    shear_range=0.3,  # More shear
    brightness_range=[0.7, 1.3],  # Brightness variation
    fill_mode='nearest'  # How to fill new pixels
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
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    class_weight=class_weights,  # Apply class weights to handle imbalance
    verbose=1,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7
        )
    ]
)

# Phase 2: Fine-tuning with more layers unfrozen
print("\n" + "=" * 60)
print("🔧 Phase 2: Fine-tuning model...")
print(f"   Unfreezing last 50 layers of base model")
print(f"   Training for {FINE_TUNE_EPOCHS} additional epochs")
print("=" * 60)
base_model.trainable = True

# Unfreeze more layers for better fine-tuning (last 50 layers)
for layer in base_model.layers[:-50]:
    layer.trainable = False

print(f"\n📊 Trainable layers: {sum([1 for layer in model.layers if layer.trainable])}")
print(f"   Total layers: {len(model.layers)}")

# Recompile with lower learning rate for fine-tuning
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Continue training with fine-tuning
history_fine = model.fit(
    train_generator,
    epochs=FINE_TUNE_EPOCHS,
    validation_data=validation_generator,
    class_weight=class_weights,  # Apply class weights in fine-tuning too
    verbose=1,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=7,
            min_lr=1e-8
        )
    ]
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
print("\n📝 Next Steps:")
print("1. Copy 'demo_model.tflite' to your app:")
print("   - Android: android/app/src/main/assets/")
print("   - iOS: Add to Xcode project")
print("2. Rebuild your app: npm run android or npm run ios")
print("3. Test with real images!")
print("\n" + "=" * 60)
