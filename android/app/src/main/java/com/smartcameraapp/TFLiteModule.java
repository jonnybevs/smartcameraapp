package com.smartcameraapp;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;

import org.tensorflow.lite.Interpreter;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;

public class TFLiteModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "TFLiteModule";
    private static final int INPUT_SIZE = 224;
    private static final int PIXEL_SIZE = 3;
    private static final int IMAGE_MEAN = 0;
    private static final float IMAGE_STD = 255.0f;
    private static final int NUM_CLASSES = 2;

    private Interpreter tflite;
    private ByteBuffer imgData;

    public TFLiteModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void loadModel(String modelPath, Promise promise) {
        try {
            android.util.Log.d("TFLiteModule", "Loading model: " + modelPath);
            
            MappedByteBuffer tfliteModel = loadModelFile(modelPath);
            android.util.Log.d("TFLiteModule", "Model file loaded. Size: " + tfliteModel.capacity() + " bytes");
            
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4);
            
            tflite = new Interpreter(tfliteModel, options);
            android.util.Log.d("TFLiteModule", "Interpreter created successfully");
            
            imgData = ByteBuffer.allocateDirect(
                4 * INPUT_SIZE * INPUT_SIZE * PIXEL_SIZE
            );
            imgData.order(ByteOrder.nativeOrder());
            android.util.Log.d("TFLiteModule", "ByteBuffer allocated: " + imgData.capacity() + " bytes");
            
            promise.resolve(true);
        } catch (Exception e) {
            android.util.Log.e("TFLiteModule", "Model load error: " + e.getMessage(), e);
            promise.reject("MODEL_LOAD_ERROR", "Failed to load model: " + e.getMessage() + ". Stack: " + android.util.Log.getStackTraceString(e), e);
        }
    }

    @ReactMethod
    public void runInference(ReadableArray imageData, Promise promise) {
        android.util.Log.d("TFLiteModule", "runInference called");
        
        if (tflite == null) {
            android.util.Log.e("TFLiteModule", "Model not loaded!");
            promise.reject("MODEL_NOT_LOADED", "Model not loaded. Call loadModel first.");
            return;
        }

        try {
            android.util.Log.d("TFLiteModule", "Input array size: " + imageData.size());
            android.util.Log.d("TFLiteModule", "Expected size: " + (INPUT_SIZE * INPUT_SIZE * PIXEL_SIZE));
            
            if (imageData.size() != INPUT_SIZE * INPUT_SIZE * PIXEL_SIZE) {
                String error = "Invalid input size. Expected " + (INPUT_SIZE * INPUT_SIZE * PIXEL_SIZE) + 
                              " but got " + imageData.size();
                android.util.Log.e("TFLiteModule", error);
                promise.reject("INVALID_INPUT_SIZE", error);
                return;
            }
            
            imgData.rewind();
            android.util.Log.d("TFLiteModule", "Filling ByteBuffer...");
            
            for (int i = 0; i < imageData.size(); i++) {
                float pixelValue = (float) imageData.getDouble(i);
                imgData.putFloat(pixelValue);
            }
            
            android.util.Log.d("TFLiteModule", "Running inference...");
            float[][] output = new float[1][NUM_CLASSES];
            
            tflite.run(imgData, output);
            
            android.util.Log.d("TFLiteModule", "Inference complete. Output: [" + output[0][0] + ", " + output[0][1] + "]");
            
            WritableArray result = new WritableNativeArray();
            for (int i = 0; i < NUM_CLASSES; i++) {
                result.pushDouble(output[0][i]);
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            android.util.Log.e("TFLiteModule", "Inference error: " + e.getMessage(), e);
            promise.reject("INFERENCE_ERROR", "Inference failed: " + e.getMessage() + ". Stack: " + android.util.Log.getStackTraceString(e), e);
        }
    }

    private MappedByteBuffer loadModelFile(String modelPath) throws IOException {
        // Try loading from raw resources first (more reliable for large files)
        try {
            int resourceId = getReactApplicationContext().getResources().getIdentifier(
                "demo_model", "raw", getReactApplicationContext().getPackageName()
            );
            if (resourceId != 0) {
                AssetFileDescriptor fileDescriptor = getReactApplicationContext().getResources().openRawResourceFd(resourceId);
                FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
                FileChannel fileChannel = inputStream.getChannel();
                long startOffset = fileDescriptor.getStartOffset();
                long declaredLength = fileDescriptor.getDeclaredLength();
                return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
            }
        } catch (Exception e) {
            // Fall back to assets if raw resource not found
        }
        
        // Fallback: try loading from assets
        AssetManager assetManager = getReactApplicationContext().getAssets();
        AssetFileDescriptor fileDescriptor = assetManager.openFd(modelPath);
        FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fileDescriptor.getStartOffset();
        long declaredLength = fileDescriptor.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }
}
