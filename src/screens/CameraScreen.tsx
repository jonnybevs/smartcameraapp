import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation';
import CaptureButton from '../components/CaptureButton';
import {preprocessImage} from '../ml/preprocess';
import TFLite from '../ml/tflite';

type CameraScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Camera'
>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

const CameraScreen: React.FC<Props> = ({navigation}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleCapture = async () => {
    if (!camera.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      setIsProcessing(true);

      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      const imageUri = Platform.OS === 'ios' 
        ? photo.path 
        : `file://${photo.path}`;

      const imageTensor = await preprocessImage(imageUri);

      const output = await TFLite.runInference(imageTensor);

      const {accepted, confidence} = TFLite.interpretOutput(output);

      navigation.replace('Result', {
        imageUri,
        accepted,
        confidence,
      });
    } catch (error) {
      console.error('Error during capture/inference:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process image. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to use this feature.
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Processing image...</Text>
          <Text style={styles.processingSubtext}>
            Running TensorFlow Lite inference
          </Text>
        </View>
      )}

      <View style={styles.controls}>
        <CaptureButton onPress={handleCapture} disabled={isProcessing} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  processingSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
});

export default CameraScreen;
