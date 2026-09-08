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
            Bitmap bitmap = BitmapFactory.decodeFile(path);
            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image at path: " + path);
                return;
            }
            
            int width = bitmap.getWidth();
            int height = bitmap.getHeight();
            android.util.Log.d("ImageProcessor", "Bitmap loaded: " + width + "x" + height);
            
            // Extract pixels
            int[] pixels = new int[width * height];
            bitmap.getPixels(pixels, 0, width, 0, 0, width, height);
            
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
            
            android.util.Log.d("ImageProcessor", "RGB array created with " + rgbArray.size() + " values");
            
            // Clean up
            bitmap.recycle();
            
            promise.resolve(rgbArray);
        } catch (Exception e) {
            android.util.Log.e("ImageProcessor", "Error extracting pixels: " + e.getMessage(), e);
            promise.reject("EXTRACTION_ERROR", "Failed to extract pixels: " + e.getMessage(), e);
        }
    }
}
