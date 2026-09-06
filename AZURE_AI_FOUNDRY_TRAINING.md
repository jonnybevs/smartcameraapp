# Training with Azure AI Foundry for Large Datasets

## 🎯 Overview

If you have **1000s of images**, Azure AI Foundry is an excellent choice for training your SmartCameraApp model. It provides:

- **Scalable compute** - GPU/CPU clusters for faster training
- **Managed infrastructure** - No local hardware limitations
- **Experiment tracking** - Monitor training metrics and compare runs
- **Model registry** - Version control for your models
- **AutoML** - Automated model selection and hyperparameter tuning

## 💰 Cost Considerations

For 1000s of images:
- **Training time:** 1-3 hours on GPU compute
- **Estimated cost:** $5-20 per training run (depending on compute tier)
- **Free tier:** Available for getting started

## 🚀 Option 1: Azure AutoML (Easiest)

### Prerequisites
- Azure subscription
- Azure AI Foundry workspace

### Steps

#### 1. Prepare Your Dataset

Organize images in the same structure:
```
dataset/
├── accepted/
│   ├── image0001.jpg
│   ├── image0002.jpg
│   └── ... (1000s of images)
└── rejected/
    ├── image0001.jpg
    ├── image0002.jpg
    └── ... (1000s of images)
```

#### 2. Upload to Azure Blob Storage

```bash
# Install Azure CLI
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create storage account (one-time)
az storage account create \
  --name smartcamerastore \
  --resource-group your-resource-group \
  --location eastus

# Upload dataset
az storage blob upload-batch \
  --account-name smartcamerastore \
  --destination dataset \
  --source ./dataset
```

#### 3. Create AutoML Experiment

**Via Azure Portal:**
1. Go to [Azure AI Foundry](https://ml.azure.com)
2. Create new workspace (if needed)
3. Navigate to "Automated ML" → "New Automated ML job"
4. Select task type: **Image Classification - Multi-class**
5. Upload/select your dataset
6. Configure:
   - **Primary metric:** Accuracy
   - **Training time:** 1-3 hours
   - **Compute:** GPU (Standard_NC6 or better)
7. Start training

**Via Python SDK:**

```python
from azure.ai.ml import MLClient
from azure.ai.ml.automl import image_classification
from azure.identity import DefaultAzureCredential

# Connect to workspace
ml_client = MLClient(
    DefaultAzureCredential(),
    subscription_id="your-subscription-id",
    resource_group_name="your-resource-group",
    workspace_name="your-workspace"
)

# Create AutoML job
image_classification_job = image_classification(
    training_data="azureml:smartcamera-dataset:1",
    target_column_name="label",
    primary_metric="accuracy",
    compute="gpu-cluster",
    experiment_name="smartcamera-classification",
    training_parameters={
        "early_stopping": True,
        "evaluation_frequency": 1,
    },
    sweep_settings={
        "sampling_algorithm": "Random",
        "early_termination": {
            "type": "bandit",
            "evaluation_interval": 2,
            "slack_factor": 0.2,
            "delay_evaluation": 6,
        },
    },
)

# Submit job
returned_job = ml_client.jobs.create_or_update(image_classification_job)
```

#### 4. Download Trained Model

After training completes:
1. Go to "Models" in Azure AI Foundry
2. Select your trained model
3. Download as ONNX or TensorFlow format
4. Convert to TensorFlow Lite (see conversion script below)

## 🔧 Option 2: Custom Training Script (More Control)

### Setup Azure ML Environment

Create `azure_train.py`:

```python
import os
from azureml.core import Workspace, Experiment, Environment, ScriptRunConfig
from azureml.core.compute import ComputeTarget, AmlCompute
from azureml.core.compute_target import ComputeTargetException

# Connect to workspace
ws = Workspace.from_config()

# Create or get compute cluster
compute_name = "gpu-cluster"
try:
    compute_target = ComputeTarget(workspace=ws, name=compute_name)
    print(f"Found existing compute target: {compute_name}")
except ComputeTargetException:
    print(f"Creating new compute target: {compute_name}")
    compute_config = AmlCompute.provisioning_configuration(
        vm_size="STANDARD_NC6",  # GPU instance
        max_nodes=1
    )
    compute_target = ComputeTarget.create(ws, compute_name, compute_config)
    compute_target.wait_for_completion(show_output=True)

# Create environment
env = Environment.from_conda_specification(
    name="tensorflow-env",
    file_path="conda_env.yml"
)

# Configure training script
config = ScriptRunConfig(
    source_directory="./training",
    script="train_model.py",
    compute_target=compute_target,
    environment=env,
    arguments=[
        "--data-path", ws.get_default_datastore(),
        "--epochs", 50,
        "--batch-size", 32
    ]
)

# Submit experiment
experiment = Experiment(workspace=ws, name="smartcamera-training")
run = experiment.submit(config)
run.wait_for_completion(show_output=True)

# Download model
run.download_file("outputs/demo_model.tflite", "demo_model.tflite")
print("Model downloaded successfully!")
```

### Modified Training Script for Azure

Create `training/train_model.py`:

```python
import argparse
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from azureml.core import Run
import os

# Get Azure ML run context
run = Run.get_context()

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("--data-path", type=str, help="Path to dataset")
parser.add_argument("--epochs", type=int, default=50)
parser.add_argument("--batch-size", type=int, default=32)
args = parser.parse_args()

# Configuration
IMG_SIZE = 224
BATCH_SIZE = args.batch_size
EPOCHS = args.epochs
DATASET_PATH = os.path.join(args.data_path, "dataset")

print(f"Training with {EPOCHS} epochs, batch size {BATCH_SIZE}")

# Data augmentation
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

# Load data
train_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

validation_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# Build model
base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.5)(x)
predictions = Dense(2, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# Compile
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Custom callback to log metrics to Azure ML
class AzureMLCallback(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        run.log("training_accuracy", logs['accuracy'])
        run.log("training_loss", logs['loss'])
        run.log("validation_accuracy", logs['val_accuracy'])
        run.log("validation_loss", logs['val_loss'])

# Train
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator,
    callbacks=[AzureMLCallback()],
    verbose=1
)

# Fine-tuning
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_fine = model.fit(
    train_generator,
    epochs=10,
    validation_data=validation_generator,
    callbacks=[AzureMLCallback()],
    verbose=1
)

# Save Keras model
os.makedirs("outputs", exist_ok=True)
model.save("outputs/trained_model.h5")

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open("outputs/demo_model.tflite", "wb") as f:
    f.write(tflite_model)

# Log final metrics
run.log("final_accuracy", history_fine.history['val_accuracy'][-1])
run.log("model_size_kb", len(tflite_model) / 1024)

print("Training complete! Model saved to outputs/")
```

### Environment File

Create `conda_env.yml`:

```yaml
name: tensorflow-env
channels:
  - conda-forge
dependencies:
  - python=3.10
  - pip
  - pip:
    - tensorflow==2.15.0
    - pillow
    - numpy
    - azureml-core
    - azureml-mlflow
```

## 📊 Benefits of Azure AI Foundry for Large Datasets

### 1. **Scalability**
- Train on powerful GPU clusters (NVIDIA V100, A100)
- Parallel processing for faster training
- Handle datasets too large for local machines

### 2. **Cost Efficiency**
- Pay only for compute time used
- Auto-shutdown when training completes
- Spot instances for 60-90% cost savings

### 3. **Experiment Tracking**
- Compare multiple training runs
- Visualize metrics in real-time
- Track hyperparameters automatically

### 4. **Data Management**
- Store datasets in Azure Blob Storage
- Version control for datasets
- Easy data sharing across team

### 5. **Model Deployment**
- Deploy directly to Azure Container Instances
- Create REST API endpoints
- A/B testing capabilities

## 🔄 Converting Azure Model to TFLite

If your Azure model is in ONNX or SavedModel format:

```python
import tensorflow as tf

# Load model
model = tf.keras.models.load_model("azure_model.h5")

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# For even smaller models (quantization)
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

# Save
with open("demo_model.tflite", "wb") as f:
    f.write(tflite_model)

print(f"Model size: {len(tflite_model) / 1024:.2f} KB")
```

## 💡 Recommended Approach for 1000s of Images

### For Best Results:

1. **Use Azure AutoML** for initial experimentation
   - Fastest way to get started
   - Automatically finds best architecture
   - No code required

2. **Switch to Custom Training** if you need:
   - Specific model architecture
   - Custom data augmentation
   - Fine-grained control over training

3. **Training Configuration:**
   - **Epochs:** 50-100 (with early stopping)
   - **Batch size:** 32-64
   - **Compute:** Standard_NC6 or Standard_NC12 (GPU)
   - **Training time:** 2-4 hours

4. **Data Split:**
   - Training: 70-80%
   - Validation: 10-15%
   - Test: 10-15%

## 📝 Step-by-Step Checklist

- [ ] Create Azure subscription
- [ ] Set up Azure AI Foundry workspace
- [ ] Upload dataset to Azure Blob Storage
- [ ] Choose training approach (AutoML vs Custom)
- [ ] Configure compute cluster
- [ ] Submit training job
- [ ] Monitor training progress
- [ ] Download trained model
- [ ] Convert to TFLite format
- [ ] Deploy to SmartCameraApp
- [ ] Test on device

## 🔗 Resources

- [Azure AI Foundry Documentation](https://learn.microsoft.com/en-us/azure/machine-learning/)
- [AutoML for Images](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-auto-train-image-models)
- [Azure ML Python SDK](https://learn.microsoft.com/en-us/python/api/overview/azure/ml/)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

## 💰 Cost Estimate

For **3000 images** (1500 per class):

| Component | Specification | Cost |
|-----------|--------------|------|
| Compute | Standard_NC6 (1 GPU) × 3 hours | ~$9 |
| Storage | 10 GB blob storage | ~$0.20/month |
| Data transfer | Minimal | ~$0.10 |
| **Total per training run** | | **~$10** |

**Note:** First-time users get $200 free credits for 30 days.

---

**Ready to scale up your training? Azure AI Foundry is the perfect solution for large datasets!**
