"""
Test the TFLite model with individual images
Usage: python test_model.py path/to/image.jpg
"""

import sys
import numpy as np
from PIL import Image
import tensorflow as tf

def load_and_preprocess_image(image_path):
    """Load and preprocess an image for the model"""
    print(f"\n📸 Loading image: {image_path}")
    
    # Load image
    img = Image.open(image_path)
    print(f"   Original size: {img.size}")
    
    # Convert to RGB if needed
    if img.mode != 'RGB':
        print(f"   Converting from {img.mode} to RGB")
        img = img.convert('RGB')
    
    # Resize to 224x224
    img = img.resize((224, 224), Image.Resampling.LANCZOS)
    print(f"   Resized to: {img.size}")
    
    # Convert to numpy array
    img_array = np.array(img, dtype=np.float32)
    print(f"   Array shape: {img_array.shape}")
    print(f"   Array dtype: {img_array.dtype}")
    print(f"   Pixel value range: [{img_array.min():.1f}, {img_array.max():.1f}]")
    
    # Normalize to [0, 1]
    img_array = img_array / 255.0
    print(f"   After normalization: [{img_array.min():.4f}, {img_array.max():.4f}]")
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    print(f"   Final shape: {img_array.shape}")
    
    return img_array

def test_model(model_path, image_path):
    """Test the TFLite model with an image"""
    print("\n" + "="*60)
    print("🧪 TESTING TFLITE MODEL")
    print("="*60)
    
    # Load the TFLite model
    print(f"\n📦 Loading model: {model_path}")
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    # Get input and output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print(f"\n📊 Model Details:")
    print(f"   Input shape: {input_details[0]['shape']}")
    print(f"   Input dtype: {input_details[0]['dtype']}")
    print(f"   Output shape: {output_details[0]['shape']}")
    print(f"   Output dtype: {output_details[0]['dtype']}")
    
    # Load and preprocess the image
    input_data = load_and_preprocess_image(image_path)
    
    # Verify input shape matches
    expected_shape = tuple(input_details[0]['shape'])
    if input_data.shape != expected_shape:
        print(f"\n❌ ERROR: Input shape mismatch!")
        print(f"   Expected: {expected_shape}")
        print(f"   Got: {input_data.shape}")
        return
    
    # Run inference
    print(f"\n🔄 Running inference...")
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    
    # Get output
    output_data = interpreter.get_tensor(output_details[0]['index'])
    print(f"   Raw output: {output_data}")
    print(f"   Output shape: {output_data.shape}")
    
    # Interpret results
    # Model outputs: [accepted_score, rejected_score]
    accepted_score = output_data[0][0]
    rejected_score = output_data[0][1]
    
    print(f"\n📊 Results:")
    print(f"   Accepted: {accepted_score:.4f} ({accepted_score*100:.2f}%)")
    print(f"   Rejected: {rejected_score:.4f} ({rejected_score*100:.2f}%)")
    
    if accepted_score > rejected_score:
        prediction = "✅ ACCEPTED"
        confidence = accepted_score * 100
    else:
        prediction = "❌ REJECTED"
        confidence = rejected_score * 100
    
    print(f"\n🎯 Prediction: {prediction}")
    print(f"   Confidence: {confidence:.2f}%")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\n❌ Usage: python test_model.py path/to/image.jpg")
        print("\nExamples:")
        print("  python test_model.py dataset/accepted/image1.jpg")
        print("  python test_model.py dataset/rejected/image1.jpg")
        print("  python test_model.py C:\\path\\to\\test_image.jpg")
        sys.exit(1)
    
    model_path = "demo_model.tflite"
    image_path = sys.argv[1]
    
    try:
        test_model(model_path, image_path)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
