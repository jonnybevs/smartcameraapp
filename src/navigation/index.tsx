import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ResultScreen from '../screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Result: {
    imageUri: string;
    accepted: boolean;
    confidence: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'ML Camera Demo'}}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{title: 'Capture Image'}}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{title: 'Result'}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
