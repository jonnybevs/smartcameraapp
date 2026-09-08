import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation';

type ResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Result'
>;

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

interface Props {
  navigation: ResultScreenNavigationProp;
  route: ResultScreenRouteProp;
}

const ResultScreen: React.FC<Props> = ({navigation, route}) => {
  const {imageUri, accepted, confidence, diagnostics} = route.params;

  const handleRetake = () => {
    navigation.navigate('Camera');
  };

  const handleHome = () => {
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageContainer}>
        <Image source={{uri: imageUri}} style={styles.image} />
      </View>

      <View
        style={[
          styles.resultCard,
          {backgroundColor: accepted ? '#e8f5e9' : '#ffebee'},
        ]}>
        <View style={styles.iconContainer}>
          {accepted ? (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          ) : (
            <View style={styles.cross}>
              <Text style={styles.crossText}>✕</Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.resultTitle,
            {color: accepted ? '#2e7d32' : '#c62828'},
          ]}>
          {accepted ? 'Accepted' : 'Rejected'}
        </Text>

        <Text style={styles.confidenceText}>
          Confidence: {(confidence * 100).toFixed(1)}%
        </Text>

        <View style={styles.divider} />

        <Text style={styles.detailsTitle}>Classification Details</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text
              style={[
                styles.detailValue,
                {color: accepted ? '#2e7d32' : '#c62828'},
              ]}>
              {accepted ? 'Image meets criteria' : 'Image does not meet criteria'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>TensorFlow Lite</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processing:</Text>
            <Text style={styles.detailValue}>On-Device</Text>
          </View>
        </View>

        {diagnostics && (
          <>
            <View style={styles.divider} />
            <Text style={styles.detailsTitle}>🔍 Debug Information</Text>
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Model Output:</Text>
              <Text style={styles.debugText}>Index 0 (Accepted): {diagnostics.acceptedScore.toFixed(4)}</Text>
              <Text style={styles.debugText}>Index 1 (Rejected): {diagnostics.rejectedScore.toFixed(4)}</Text>
              
              <Text style={[styles.debugTitle, {marginTop: 10}]}>Preprocessing:</Text>
              <Text style={styles.debugText}>RGB range: [{diagnostics.rgbMin}, {diagnostics.rgbMax}]</Text>
              <Text style={styles.debugText}>Normalized: [{diagnostics.normMin.toFixed(4)}, {diagnostics.normMax.toFixed(4)}]</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}>
          <Text style={styles.retakeButtonText}>Retake Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.homeButton]}
          onPress={handleHome}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultCard: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 15,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  cross: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossText: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confidenceText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 15,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  detailsContainer: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeButton: {
    backgroundColor: '#6200ee',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  homeButtonText: {
    color: '#6200ee',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
});

export default ResultScreen;
