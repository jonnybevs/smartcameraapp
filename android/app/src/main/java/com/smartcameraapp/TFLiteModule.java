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
            MappedByteBuffer tfliteModel = loadModelFile(modelPath);
            
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4);
            
            tflite = new Interpreter(tfliteModel, options);
            
            imgData = ByteBuffer.allocateDirect(
                4 * INPUT_SIZE * INPUT_SIZE * PIXEL_SIZE
            );
            imgData.order(ByteOrder.nativeOrder());
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("MODEL_LOAD_ERROR", "Failed to load model: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void runInference(ReadableArray imageData, Promise promise) {
        if (tflite == null) {
            promise.reject("MODEL_NOT_LOADED", "Model not loaded. Call loadModel first.");
            return;
        }

        try {
            imgData.rewind();
            
            for (int i = 0; i < imageData.size(); i++) {
                float pixelValue = (float) imageData.getDouble(i);
                imgData.putFloat(pixelValue);
            }
            
            float[][] output = new float[1][NUM_CLASSES];
            
            tflite.run(imgData, output);
            
            WritableArray result = new WritableNativeArray();
            for (int i = 0; i < NUM_CLASSES; i++) {
                result.pushDouble(output[0][i]);
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("INFERENCE_ERROR", "Inference failed: " + e.getMessage(), e);
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
