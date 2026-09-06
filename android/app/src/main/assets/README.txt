PLACE YOUR TFLITE MODEL HERE

File name: demo_model.tflite

This is where your trained TensorFlow Lite model should be placed.

Model Requirements:
- Input: 224x224 RGB image (float32)
- Output: 2 classes (float32 array)
  - Index 0: "Not accepted" score
  - Index 1: "Accepted" score

After adding your model, rebuild the app:
  cd ../../../../../..
  npm run android

See MODEL_TRAINING_GUIDE.md for instructions on training your model.
