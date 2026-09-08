import RNFS from 'react-native-fs';
import {Platform} from 'react-native';

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
    const normalizedArray = normalizePixels(rgbArray);
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
  console.log('[Preprocess] decodeAndResize called');
  console.log('[Preprocess] ERROR: This function uses web APIs (Image, canvas) that do not exist in React Native!');
  console.log('[Preprocess] Platform:', Platform.OS);
  
  throw new Error(
    'Image preprocessing not implemented for React Native. ' +
    'This code uses browser APIs (Image, canvas) which are not available in React Native. ' +
    'Need to use react-native-image-resizer or similar library instead.'
  );
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
