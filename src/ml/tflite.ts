import {NativeModules, Platform} from 'react-native';

interface TFLiteModule {
  loadModel(modelName: string): Promise<boolean>;
  runInference(imageData: number[]): Promise<number[]>;
}

const TFLiteNative = NativeModules.TFLiteModule as TFLiteModule;

if (!TFLiteNative) {
  throw new Error(
    'TFLiteModule native module is not available. Make sure native code is properly linked.',
  );
}

export class TFLite {
  private static modelLoaded = false;

  static async loadModel(): Promise<boolean> {
    if (this.modelLoaded) {
      return true;
    }

    try {
      const modelName = 'demo_model.tflite';
      const success = await TFLiteNative.loadModel(modelName);
      this.modelLoaded = success;
      return success;
    } catch (error) {
      console.error('Failed to load TFLite model:', error);
      return false;
    }
  }

  static async runInference(imageData: number[]): Promise<number[]> {
    if (!this.modelLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const output = await TFLiteNative.runInference(imageData);
      return output;
    } catch (error) {
      console.error('Inference failed:', error);
      throw error;
    }
  }

  static interpretOutput(output: number[]): {accepted: boolean; confidence: number} {
    if (output.length !== 2) {
      throw new Error('Invalid output format. Expected 2 values.');
    }

    // Model outputs: [accepted_score, rejected_score]
    const acceptedScore = output[0];
    const rejectedScore = output[1];
    
    const accepted = acceptedScore > rejectedScore;
    const confidence = Math.max(acceptedScore, rejectedScore);

    return {accepted, confidence};
  }
}

export default TFLite;
