import RNFS from 'react-native-fs';
import {Platform, NativeModules} from 'react-native';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const {ImageProcessor} = NativeModules;

const INPUT_SIZE = 224;

export interface ImageDimensions {
  width: number;
  height: number;
}

export async function preprocessImage(imageUri: string): Promise<number[]> {
  try {
    console.log('[Preprocess] Starting preprocessing for:', imageUri);
    
    console.log('[Preprocess] Step 1: Loading image as base64...');
    const imageData = await loadImageAsBase64(imageUri);
    console.log('[Preprocess] Base64 loaded, length:', imageData.length);
    
    console.log('[Preprocess] Step 2: Decoding and resizing...');
    const rgbArray = await decodeAndResize(imageData);
    console.log('[Preprocess] RGB array created, length:', rgbArray.length);
    
    console.log('[Preprocess] Step 3: Normalizing pixels...');
    console.log('[Preprocess] Before normalization - sample values:', rgbArray.slice(0, 10));
    const normalizedArray = normalizePixels(rgbArray);
    console.log('[Preprocess] After normalization - sample values:', normalizedArray.slice(0, 10));
    const normMin = normalizedArray.reduce((min, val) => Math.min(min, val), normalizedArray[0]);
    const normMax = normalizedArray.reduce((max, val) => Math.max(max, val), normalizedArray[0]);
    console.log('[Preprocess] Normalized range: [', normMin, ',', normMax, ']');
    console.log('[Preprocess] Normalization complete, final length:', normalizedArray.length);
    
    return normalizedArray;
  } catch (error: any) {
    console.error('[Preprocess] ERROR:', error);
    console.error('[Preprocess] Error message:', error?.message);
    console.error('[Preprocess] Error stack:', error?.stack);
    throw new Error(`Preprocessing failed: ${error?.message || 'Unknown error'}`);
  }
}

async function loadImageAsBase64(uri: string): Promise<string> {
  try {
    console.log('[Preprocess] Reading file from:', uri);
    const base64 = await RNFS.readFile(uri, 'base64');
    console.log('[Preprocess] File read successfully');
    return base64;
  } catch (error: any) {
    console.error('[Preprocess] Error reading image file:', error);
    throw new Error(`Failed to read image file: ${error?.message}`);
  }
}

async function decodeAndResize(base64Image: string): Promise<number[]> {
  console.log('[Preprocess] decodeAndResize called - using React Native image resizer');
  
  try {
    // Write base64 to temporary file
    const tempPath = `${RNFS.CachesDirectoryPath}/temp_image_${Date.now()}.jpg`;
    console.log('[Preprocess] Writing temp file:', tempPath);
    
    await RNFS.writeFile(tempPath, base64Image, 'base64');
    console.log('[Preprocess] Temp file written');
    
    // Resize image to 224x224 using native resizer
    // Use 'stretch' mode to ensure exact dimensions (224x224)
    console.log('[Preprocess] Resizing image to', INPUT_SIZE, 'x', INPUT_SIZE);
    const resizedImage = await ImageResizer.createResizedImage(
      tempPath,
      INPUT_SIZE,
      INPUT_SIZE,
      'JPEG',
      100,
      0,
      undefined,
      false,
      {mode: 'stretch', onlyScaleDown: false}
    );
    
    console.log('[Preprocess] Image resized:', resizedImage.uri);
    
    // Read resized image as base64
    const resizedBase64 = await RNFS.readFile(resizedImage.uri, 'base64');
    console.log('[Preprocess] Resized image read, base64 length:', resizedBase64.length);
    
    // Convert base64 JPEG to RGB array
    // For now, we'll use a native module approach or decode manually
    // Since we can't decode JPEG in pure JS, we need to pass it to native
    const rgbArray = await decodeJPEGToRGB(resizedImage.uri);
    
    // Clean up temp files
    try {
      await RNFS.unlink(tempPath);
      await RNFS.unlink(resizedImage.uri);
    } catch (cleanupError) {
      console.warn('[Preprocess] Cleanup error:', cleanupError);
    }
    
    console.log('[Preprocess] RGB array created, length:', rgbArray.length);
    
    // Log sample values for debugging (avoid spread operator on large arrays)
    console.log('[Preprocess] Sample RGB values (first 10):', rgbArray.slice(0, 10));
    const minVal = rgbArray.reduce((min, val) => Math.min(min, val), rgbArray[0]);
    const maxVal = rgbArray.reduce((max, val) => Math.max(max, val), rgbArray[0]);
    console.log('[Preprocess] RGB value range: [', minVal, ',', maxVal, ']');
    
    return rgbArray;
  } catch (error: any) {
    console.error('[Preprocess] decodeAndResize error:', error);
    throw new Error(`Failed to decode and resize image: ${error?.message}`);
  }
}

// Helper function to decode JPEG to RGB array using native module
async function decodeJPEGToRGB(imageUri: string): Promise<number[]> {
  console.log('[Preprocess] decodeJPEGToRGB called for:', imageUri);
  
  try {
    if (!ImageProcessor) {
      throw new Error('ImageProcessor native module not available');
    }
    
    console.log('[Preprocess] Calling native ImageProcessor.extractRGBPixels...');
    const rgbArray = await ImageProcessor.extractRGBPixels(imageUri);
    console.log('[Preprocess] Native extraction complete, array length:', rgbArray.length);
    
    const expectedSize = INPUT_SIZE * INPUT_SIZE * 3;
    if (rgbArray.length !== expectedSize) {
      console.warn(`[Preprocess] WARNING: Expected ${expectedSize} values but got ${rgbArray.length}`);
    }
    
    return rgbArray;
  } catch (error: any) {
    console.error('[Preprocess] decodeJPEGToRGB error:', error);
    throw new Error(`Failed to decode JPEG to RGB: ${error?.message}`);
  }
}

function normalizePixels(pixels: number[]): number[] {
  return pixels.map(pixel => pixel / 255.0);
}

export function resizeImage(
  imageData: Uint8ClampedArray,
  originalWidth: number,
  originalHeight: number,
): number[] {
  const resized: number[] = [];
  
  const scaleX = originalWidth / INPUT_SIZE;
  const scaleY = originalHeight / INPUT_SIZE;
  
  for (let y = 0; y < INPUT_SIZE; y++) {
    for (let x = 0; x < INPUT_SIZE; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIndex = (srcY * originalWidth + srcX) * 4;
      
      resized.push(imageData[srcIndex]);
      resized.push(imageData[srcIndex + 1]);
      resized.push(imageData[srcIndex + 2]);
    }
  }
  
  return resized;
}
