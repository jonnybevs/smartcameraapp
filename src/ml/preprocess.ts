import RNFS from 'react-native-fs';
import {Platform} from 'react-native';

const INPUT_SIZE = 224;

export interface ImageDimensions {
  width: number;
  height: number;
}

export async function preprocessImage(imageUri: string): Promise<number[]> {
  try {
    const imageData = await loadImageAsBase64(imageUri);
    const rgbArray = await decodeAndResize(imageData);
    const normalizedArray = normalizePixels(rgbArray);
    
    return normalizedArray;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
}

async function loadImageAsBase64(uri: string): Promise<string> {
  try {
    const base64 = await RNFS.readFile(uri, 'base64');
    return base64;
  } catch (error) {
    console.error('Error reading image file:', error);
    throw error;
  }
}

async function decodeAndResize(base64Image: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = INPUT_SIZE;
        canvas.height = INPUT_SIZE;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(image, 0, 0, INPUT_SIZE, INPUT_SIZE);
        
        const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
        const pixels = imageData.data;
        
        const rgbArray: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          rgbArray.push(pixels[i]);
          rgbArray.push(pixels[i + 1]);
          rgbArray.push(pixels[i + 2]);
        }
        
        resolve(rgbArray);
      } catch (error) {
        reject(error);
      }
    };
    
    image.onerror = (error) => {
      reject(new Error('Failed to load image'));
    };
    
    image.src = `data:image/jpeg;base64,${base64Image}`;
  });
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
