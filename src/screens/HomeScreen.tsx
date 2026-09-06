import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation';
import TFLite from '../ml/tflite';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      setLoading(true);
      const success = await TFLite.loadModel();
      setModelLoaded(success);
      
      if (!success) {
        Alert.alert(
          'Model Load Failed',
          'Failed to load TensorFlow Lite model. Please ensure demo_model.tflite is in the correct location.',
        );
      }
    } catch (error) {
      console.error('Error loading model:', error);
      Alert.alert('Error', 'Failed to initialize ML model');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = () => {
    if (!modelLoaded) {
      Alert.alert(
        'Model Not Ready',
        'Please wait for the model to load before using the camera.',
      );
      return;
    }
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ML Camera Demo</Text>
        <Text style={styles.subtitle}>
          On-Device Image Classification
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Loading ML Model...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  {backgroundColor: modelLoaded ? '#4caf50' : '#f44336'},
                ]}
              />
              <Text style={styles.statusText}>
                Model Status: {modelLoaded ? 'Ready' : 'Not Loaded'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                !modelLoaded && styles.buttonDisabled,
              ]}
              onPress={handleOpenCamera}
              disabled={!modelLoaded}>
              <Text style={styles.buttonText}>Open Camera</Text>
            </TouchableOpacity>

            {!modelLoaded && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadModel}>
                <Text style={styles.retryButtonText}>Retry Load Model</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Tap "Open Camera" to capture an image
          </Text>
          <Text style={styles.infoText}>
            2. The app runs TensorFlow Lite inference
          </Text>
          <Text style={styles.infoText}>
            3. See if your image is accepted or rejected
          </Text>
          <Text style={styles.infoNote}>
            ✓ Fully offline • No cloud processing
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 50,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoNote: {
    fontSize: 14,
    color: '#4caf50',
    marginTop: 10,
    fontWeight: '600',
  },
});

export default HomeScreen;
