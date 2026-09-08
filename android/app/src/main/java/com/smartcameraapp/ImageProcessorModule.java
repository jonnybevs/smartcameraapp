package com.smartcameraapp;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;

import java.io.InputStream;

public class ImageProcessorModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "ImageProcessor";

    public ImageProcessorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void extractRGBPixels(String imageUri, Promise promise) {
        try {
            android.util.Log.d("ImageProcessor", "Extracting RGB pixels from: " + imageUri);
            
            // Remove file:// prefix if present
            String path = imageUri.replace("file://", "");
            
            // Load bitmap
            Bitmap originalBitmap = BitmapFactory.decodeFile(path);
            if (originalBitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image at path: " + path);
                return;
            }
            
            int width = originalBitmap.getWidth();
            int height = originalBitmap.getHeight();
            android.util.Log.d("ImageProcessor", "Original bitmap loaded: " + width + "x" + height);
            
            // Ensure bitmap is exactly 224x224 - scale if needed
            Bitmap bitmap;
            if (width != 224 || height != 224) {
                android.util.Log.d("ImageProcessor", "Scaling bitmap to 224x224");
                bitmap = Bitmap.createScaledBitmap(originalBitmap, 224, 224, true);
                originalBitmap.recycle(); // Clean up original
                android.util.Log.d("ImageProcessor", "Bitmap scaled to: " + bitmap.getWidth() + "x" + bitmap.getHeight());
            } else {
                bitmap = originalBitmap;
            }
            
            // Extract pixels
            int[] pixels = new int[224 * 224];
            bitmap.getPixels(pixels, 0, 224, 0, 0, 224, 224);
            
            // Convert to RGB array (separate R, G, B values)
            WritableArray rgbArray = new WritableNativeArray();
            for (int pixel : pixels) {
                int r = (pixel >> 16) & 0xFF;
                int g = (pixel >> 8) & 0xFF;
                int b = pixel & 0xFF;
                
                rgbArray.pushInt(r);
                rgbArray.pushInt(g);
                rgbArray.pushInt(b);
            }
            
            int expectedSize = 224 * 224 * 3; // 150,528
            android.util.Log.d("ImageProcessor", "RGB array created with " + rgbArray.size() + " values (expected: " + expectedSize + ")");
            
            if (rgbArray.size() != expectedSize) {
                android.util.Log.e("ImageProcessor", "ERROR: Array size mismatch! Got " + rgbArray.size() + " but expected " + expectedSize);
            }
            
            // Clean up
            bitmap.recycle();
            
            promise.resolve(rgbArray);
        } catch (Exception e) {
            android.util.Log.e("ImageProcessor", "Error extracting pixels: " + e.getMessage(), e);
            promise.reject("EXTRACTION_ERROR", "Failed to extract pixels: " + e.getMessage(), e);
        }
    }
}
